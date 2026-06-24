"use client";

import * as React from "react";
import {
  Printer,
  Truck,
  ReceiptText,
  Wallet,
  XCircle,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { PurchaseOrder, POStatus, POPayMode, Vendor } from "@/lib/vendors";
import { PO_PAY_MODES } from "@/lib/vendors";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { Money } from "@/components/ui/money";
import { cn, formatDate } from "@/lib/utils";

const STAGES: { key: POStatus; label: string }[] = [
  { key: "issued", label: "Issued" },
  { key: "received", label: "Received" },
  { key: "invoiced", label: "Invoiced" },
  { key: "paid", label: "Paid" },
];

const STAGE_INDEX: Record<POStatus, number> = {
  issued: 0,
  partial: 0,
  received: 1,
  invoiced: 2,
  paid: 3,
  closed: -1,
};

type Mode = null | "receive" | "invoice" | "pay" | "close";

export function PODetailSheet({
  po,
  vendorName,
  onClose,
  onChanged,
}: {
  po: PurchaseOrder | null;
  vendorName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [mode, setMode] = React.useState<Mode>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setMode(null);
  }, [po?.id]);

  if (!po) return null;
  const closed = po.status === "closed";
  const stageIdx = STAGE_INDEX[po.status];

  async function act(path: string, body?: unknown) {
    setBusy(true);
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    setMode(null);
    onChanged();
  }

  return (
    <Sheet
      open={!!po}
      onClose={onClose}
      title={po.rfqTitle}
      description={`${po.id} · ${vendorName}${po.manual ? " · Direct purchase" : ""}`}
    >
      <div className="space-y-5">
        {/* status + total */}
        <div className="flex items-center justify-between">
          {closed ? (
            <Badge variant="muted">
              <XCircle className="size-3" /> Closed
            </Badge>
          ) : (
            <Badge variant={po.status === "paid" ? "good" : "default"}>
              {po.status === "partial" ? "Partially received" : STAGES[stageIdx]?.label}
            </Badge>
          )}
          <span className="text-lg font-bold tabular-nums">
            <Money value={po.total} />
          </span>
        </div>

        {/* stepper */}
        {!closed && (
          <div className="flex items-center">
            {STAGES.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                      i <= stageIdx
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {i < stageIdx || po.status === "paid" ? <CheckCircle2 className="size-4" /> : i + 1}
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground">{s.label}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={cn("mx-1 h-0.5 flex-1", i < stageIdx ? "bg-primary" : "bg-border")} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ordered lines + received */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Items
          </h3>
          <ul className="divide-y rounded-md border text-sm">
            {po.items.map((l, i) => {
              const rec = po.received[l.itemName] ?? 0;
              return (
                <li key={i} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate">{l.itemName}</span>
                  <span className="text-xs text-muted-foreground">
                    {po.receipts.length > 0 && (
                      <span
                        className={cn(
                          "mr-2",
                          rec === l.qty ? "text-success" : rec > l.qty ? "text-warning" : "text-danger"
                        )}
                      >
                        {rec}/{l.qty} recd
                      </span>
                    )}
                    {l.qty} × <Money value={l.unitPrice} />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* receipt history */}
        {po.receipts.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Goods receipts
            </h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              {po.receipts.map((g) => {
                const recd = g.lines.reduce((s, l) => s + l.qty, 0);
                const freeUnits = g.lines.reduce((s, l) => s + (l.free ?? 0), 0);
                return (
                  <p key={g.id}>
                    {formatDate(g.date)} · {recd} units{freeUnits ? ` + ${freeUnits} free` : ""}
                    {g.note ? ` — ${g.note}` : ""}
                  </p>
                );
              })}
            </div>
          </section>
        )}

        {/* invoice + payment summary */}
        {po.invoice && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            <ReceiptText className="mr-1 inline size-4" />
            Invoice <span className="font-medium">{po.invoice.number}</span> ·{" "}
            <Money value={po.invoice.amount} /> · {formatDate(po.invoice.date)}
          </p>
        )}
        {po.payment && (
          <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            <Wallet className="mr-1 inline size-4" />
            Paid <Money value={po.payment.amount} /> via {po.payment.mode}
            {po.payment.reference ? ` (${po.payment.reference})` : ""} on{" "}
            {formatDate(po.payment.date)}
          </p>
        )}
        {closed && po.closedReason && (
          <p className="text-xs text-muted-foreground">Closed: {po.closedReason}</p>
        )}

        {/* inline action forms */}
        {mode === "receive" && (
          <ReceiveForm po={po} busy={busy} onCancel={() => setMode(null)} onSubmit={(b) => act(`/api/procurement/pos/${po.id}/receive`, b)} />
        )}
        {mode === "invoice" && (
          <InvoiceForm po={po} busy={busy} onCancel={() => setMode(null)} onSubmit={(b) => act(`/api/procurement/pos/${po.id}/invoice`, b)} />
        )}
        {mode === "pay" && (
          <PayForm po={po} busy={busy} onCancel={() => setMode(null)} onSubmit={(b) => act(`/api/procurement/pos/${po.id}/pay`, b)} />
        )}
        {mode === "close" && (
          <CloseForm busy={busy} onCancel={() => setMode(null)} onSubmit={(b) => act(`/api/procurement/pos/${po.id}/close`, b)} />
        )}

        {/* action buttons */}
        {mode === null && !closed && (
          <div className="grid grid-cols-2 gap-2">
            {(po.status === "issued" || po.status === "partial") && (
              <Button variant="outline" onClick={() => setMode("receive")}>
                <Truck className="size-4" /> Receive goods
              </Button>
            )}
            {(po.status === "partial" || po.status === "received") && (
              <Button variant="outline" onClick={() => setMode("invoice")}>
                <ReceiptText className="size-4" /> Record invoice
              </Button>
            )}
            {po.status === "invoiced" && (
              <Button onClick={() => setMode("pay")}>
                <Wallet className="size-4" /> Record payment
              </Button>
            )}
            {po.status !== "paid" && (
              <Button variant="ghost" onClick={() => setMode("close")}>
                <XCircle className="size-4" /> Close PO
              </Button>
            )}
          </div>
        )}

        {/* print */}
        <a
          href={`/vendors/po/${po.id}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Printer className="size-4" /> Open printable PO <ExternalLink className="size-3.5 opacity-60" />
        </a>
      </div>
    </Sheet>
  );
}

function FormShell({
  title,
  busy,
  canSubmit,
  submitLabel,
  onCancel,
  onSubmit,
  children,
}: {
  title: string;
  busy: boolean;
  canSubmit: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="space-y-3">{children}</div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={busy || !canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function ReceiveForm({
  po,
  busy,
  onCancel,
  onSubmit,
}: {
  po: PurchaseOrder;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (b: { lines: { itemName: string; qty: number; free: number }[]; note?: string }) => void;
}) {
  const [qty, setQty] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    po.items.forEach((l) => {
      init[l.itemName] = Math.max(0, l.qty - (po.received[l.itemName] ?? 0));
    });
    return init;
  });
  const [free, setFree] = React.useState<Record<string, number>>({});
  const [hasFree, setHasFree] = React.useState(false);
  const [note, setNote] = React.useState("");
  const total = po.items.reduce(
    (s, l) => s + (Number(qty[l.itemName]) || 0) + (hasFree ? Number(free[l.itemName]) || 0 : 0),
    0
  );

  return (
    <FormShell
      title="Goods receipt note"
      busy={busy}
      canSubmit={total !== 0}
      submitLabel="Confirm receipt"
      onCancel={onCancel}
      onSubmit={() =>
        onSubmit({
          lines: po.items.map((l) => ({
            itemName: l.itemName,
            qty: Number(qty[l.itemName]) || 0,
            free: hasFree ? Number(free[l.itemName]) || 0 : 0,
          })),
          note,
        })
      }
    >
      <p className="text-xs text-muted-foreground">
        Receive prefills the outstanding balance (editable).
      </p>
      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={hasFree}
          onChange={(e) => setHasFree(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Vendor gave free / bonus stock
        <span className="font-normal text-muted-foreground">— adds to stock, not billed</span>
      </label>
      {po.items.map((l) => {
        const already = po.received[l.itemName] ?? 0;
        const balance = Math.max(0, l.qty - already);
        const fullyDone = already >= l.qty;
        return (
          <div key={l.itemName} className="rounded-md border p-2.5">
            <p className="truncate text-sm font-medium" title={l.itemName}>
              {l.itemName}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              ordered <span className="tabular-nums">{l.qty}</span> · received{" "}
              <span className={cn("tabular-nums", already > 0 && (fullyDone ? "text-success" : "text-warning"))}>
                {already}
              </span>{" "}
              · balance{" "}
              <span className={cn("font-medium tabular-nums", balance === 0 && "text-success")}>{balance}</span>
            </p>
            <div className="mt-2 flex gap-3">
              <label className="flex-1">
                <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  {hasFree ? "Receive (billable)" : "Receive"}
                </span>
                <Input
                  type="number"
                  value={String(qty[l.itemName] ?? 0)}
                  onChange={(e) => setQty((p) => ({ ...p, [l.itemName]: Number(e.target.value) }))}
                />
              </label>
              {hasFree && (
                <label className="flex-1">
                  <span className="mb-1 block text-[11px] font-medium text-muted-foreground">Free (bonus)</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={String(free[l.itemName] ?? 0)}
                    onChange={(e) => setFree((p) => ({ ...p, [l.itemName]: Number(e.target.value) }))}
                  />
                </label>
              )}
            </div>
          </div>
        );
      })}
      <Input placeholder="Note (e.g. short delivery, batch no.)" value={note} onChange={(e) => setNote(e.target.value)} />
    </FormShell>
  );
}

function InvoiceForm({
  po,
  busy,
  onCancel,
  onSubmit,
}: {
  po: PurchaseOrder;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (b: { number: string; date: string; amount: number }) => void;
}) {
  const [number, setNumber] = React.useState("");
  const [amount, setAmount] = React.useState(po.total);

  return (
    <FormShell
      title="Record vendor invoice"
      busy={busy}
      canSubmit={!!number.trim()}
      submitLabel="Save invoice"
      onCancel={onCancel}
      onSubmit={() => onSubmit({ number, date: new Date().toISOString(), amount: Number(amount) })}
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Invoice number</span>
        <Input placeholder="INV-XXXX" value={number} onChange={(e) => setNumber(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          Invoice amount (≈ <Money value={Number(amount) || 0} />)
        </span>
        <Input type="number" value={String(amount)} onChange={(e) => setAmount(Number(e.target.value))} />
      </label>
    </FormShell>
  );
}

function PayForm({
  po,
  busy,
  onCancel,
  onSubmit,
}: {
  po: PurchaseOrder;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (b: { amount: number; mode: POPayMode; reference?: string }) => void;
}) {
  const [amount, setAmount] = React.useState(po.invoice?.amount ?? po.total);
  const [mode, setMode] = React.useState<POPayMode>("bank");
  const [reference, setReference] = React.useState("");

  return (
    <FormShell
      title="Record payment"
      busy={busy}
      canSubmit={Number(amount) > 0}
      submitLabel="Mark paid"
      onCancel={onCancel}
      onSubmit={() => onSubmit({ amount: Number(amount), mode, reference })}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount</span>
          <Input type="number" value={String(amount)} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Mode</span>
          <Select value={mode} onChange={(e) => setMode(e.target.value as POPayMode)} className="w-full capitalize">
            {PO_PAY_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Reference (optional)</span>
        <Input placeholder="UTR / cheque no." value={reference} onChange={(e) => setReference(e.target.value)} />
      </label>
    </FormShell>
  );
}

function CloseForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (b: { reason: string }) => void;
}) {
  const [reason, setReason] = React.useState("");
  return (
    <FormShell
      title="Close purchase order"
      busy={busy}
      canSubmit
      submitLabel="Close PO"
      onCancel={onCancel}
      onSubmit={() => onSubmit({ reason })}
    >
      <p className="text-xs text-muted-foreground">
        Closing finalizes the PO and stops further receipts (e.g. short delivery accepted).
      </p>
      <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
    </FormShell>
  );
}

interface DraftLine {
  name: string;
  qty: number;
  unitPrice: number;
}

export function ManualPurchaseSheet({
  open,
  vendors,
  onClose,
  onCreated,
}: {
  open: boolean;
  vendors: Vendor[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const active = vendors.filter((v) => v.active);
  const [vendorId, setVendorId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [lines, setLines] = React.useState<DraftLine[]>([{ name: "", qty: 1, unitPrice: 0 }]);
  const [invoiceNumber, setInvoiceNumber] = React.useState("");
  const [pay, setPay] = React.useState(false);
  const [payMode, setPayMode] = React.useState<POPayMode>("bank");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setVendorId(active[0]?.id ?? "");
      setTitle("");
      setLines([{ name: "", qty: 1, unitPrice: 0 }]);
      setInvoiceNumber("");
      setPay(false);
      setPayMode("bank");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  const valid = vendorId && title.trim() && lines.some((l) => l.name.trim() && l.qty > 0);

  async function submit() {
    if (!valid) return;
    setBusy(true);
    await fetch("/api/procurement/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId,
        title,
        items: lines.filter((l) => l.name.trim()),
        invoiceNumber: invoiceNumber.trim() || undefined,
        pay: pay && !!invoiceNumber.trim(),
        payMode,
      }),
    });
    setBusy(false);
    onCreated();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Direct purchase"
      description="Record a purchase without an RFQ — books goods received in full"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !valid}>
            {busy ? "Saving…" : "Record purchase"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Vendor</span>
          <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full">
            {active.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</span>
          <Input placeholder="e.g. Emergency burs restock" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Items</span>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input className="flex-1" placeholder="Item" value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} />
                <Input type="number" min="1" className="w-14" value={String(l.qty)} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} />
                <Input type="number" className="w-20" placeholder="price" value={String(l.unitPrice)} onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })} />
                <Button variant="ghost" size="icon" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, { name: "", qty: 1, unitPrice: 0 }])}>
              <Plus className="size-3.5" /> Add item
            </Button>
            <span className="text-sm font-semibold">
              Total <Money value={total} />
            </span>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Vendor invoice no. (optional)
          </span>
          <Input placeholder="Leave blank to record later" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </label>

        {invoiceNumber.trim() && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pay} onChange={(e) => setPay(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            Mark as paid now
            {pay && (
              <Select value={payMode} onChange={(e) => setPayMode(e.target.value as POPayMode)} className="ml-auto h-8 capitalize">
                {PO_PAY_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            )}
          </label>
        )}
        <p className="text-[11px] text-muted-foreground">
          A direct purchase is booked as goods received in full. Add an invoice number to mark it billed, and tick “paid” to settle it immediately.
        </p>
      </div>
    </Sheet>
  );
}
