"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, Receipt, IndianRupee, Check, FileText, Eye } from "lucide-react";
import type { Invoice, InvoiceStatus, PayMode } from "@/lib/clinic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Money } from "@/components/ui/money";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { cn, formatDate as fmtDate } from "@/lib/utils";

interface PatientLite {
  id: string;
  name: string;
}
interface Row extends Invoice {
  patientName: string;
}

const FILTERS = ["all", "paid", "partial", "due"] as const;

export function BillingClient({
  invoices,
  patients,
  procedures,
}: {
  invoices: Row[];
  patients: PatientLite[];
  procedures: string[];
}) {
  const [rowsData, setRowsData] = React.useState<Row[]>(invoices);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("all");
  const [creating, setCreating] = React.useState(false);
  const [paying, setPaying] = React.useState<Row | null>(null);

  const paidOf = (i: Row) => (i.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const outstandingOf = (i: Row) => Math.max(0, i.total - paidOf(i));

  // amount actually received per invoice — uses recorded payments when present,
  // otherwise falls back to status (seed invoices carry no payment log)
  const receivedOf = (i: Row) => {
    const p = paidOf(i);
    if (p > 0) return Math.min(p, i.total);
    if (i.status === "paid") return i.total;
    if (i.status === "partial") return i.total / 2;
    return 0;
  };

  const billed = rowsData.reduce((s, i) => s + i.total, 0);
  const collected = rowsData.reduce((s, i) => s + receivedOf(i), 0);
  const outstanding = rowsData.reduce((s, i) => s + (i.total - receivedOf(i)), 0);

  const rows = rowsData.filter((i) => filter === "all" || i.status === filter);

  async function createInvoice(payload: {
    patientId: string;
    items: { desc: string; amount: number }[];
    status: InvoiceStatus;
    mode: Invoice["mode"];
  }) {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved: Invoice = await res.json();
    const p = patients.find((x) => x.id === saved.patientId);
    setRowsData((prev) => [
      { ...saved, patientName: p?.name ?? "—" },
      ...prev,
    ]);
    setCreating(false);
  }

  async function submitPayment(payload: { amount: number; mode: PayMode; reference: string }) {
    if (!paying) return;
    const id = paying.id;
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved: Invoice = await res.json();
    setRowsData((prev) => prev.map((i) => (i.id === id ? { ...i, ...saved } : i)));
    setPaying(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total billed</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            <Money value={billed} />
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Collected</p>
          <p className="mt-2 text-2xl font-bold text-success tabular-nums">
            <Money value={collected} />
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-danger tabular-nums">
            <Money value={outstanding} />
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                filter === f ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Quick invoice
          </Button>
          <Link href="/billing/new">
            <Button>
              <FileText className="size-4" /> Invoice builder
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Mode</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id} className="border-b transition-colors last:border-0 hover:bg-accent/50">
                  <td className="px-5 py-3 font-mono text-xs font-medium">{inv.id}</td>
                  <td className="px-5 py-3">
                    <Link href={`/patients/${inv.patientId}`} className="hover:underline">
                      {inv.patientName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(inv.date)}</td>
                  <td className="px-5 py-3 uppercase text-muted-foreground">{inv.mode}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    <Money value={inv.total} />
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={inv.status === "paid" ? "good" : inv.status === "due" ? "out" : "low"}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/billing/${inv.id}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" title="View invoice">
                          <Eye className="size-3.5" /> View
                        </Button>
                      </Link>
                      {inv.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <Check className="size-3.5" /> Settled
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setPaying(inv)}>
                          <IndianRupee className="size-3.5" /> Record payment
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateInvoiceSheet
        open={creating}
        onClose={() => setCreating(false)}
        patients={patients}
        procedures={procedures}
        onCreate={createInvoice}
      />

      <RecordPaymentSheet
        invoice={paying}
        outstanding={paying ? outstandingOf(paying) : 0}
        onClose={() => setPaying(null)}
        onSubmit={submitPayment}
      />
    </div>
  );
}

function RecordPaymentSheet({
  invoice,
  outstanding,
  onClose,
  onSubmit,
}: {
  invoice: Row | null;
  outstanding: number;
  onClose: () => void;
  onSubmit: (p: { amount: number; mode: PayMode; reference: string }) => void;
}) {
  const { currency } = usePrefs();
  const rate = currency.rate || 1;
  const [amount, setAmount] = React.useState("");
  const [mode, setMode] = React.useState<PayMode>("upi");
  const [reference, setReference] = React.useState("");

  React.useEffect(() => {
    if (invoice) {
      setAmount(String(Math.round(outstanding * rate))); // show in active currency
      setMode(invoice.mode);
      setReference("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  const amtBase = (parseFloat(amount) || 0) / rate; // entered in active currency → base
  const valid = amtBase > 0;
  const willSettle = amtBase >= outstanding - 0.01;

  return (
    <Sheet
      open={!!invoice}
      onClose={onClose}
      title="Record payment"
      description={invoice ? `${invoice.id} · ${invoice.patientName}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={() => onSubmit({ amount: amtBase, mode, reference })}>
            <IndianRupee className="size-4" /> Save payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <span className="text-sm text-muted-foreground">Outstanding</span>
          <span className="text-lg font-bold tabular-nums text-danger">
            <Money value={outstanding} />
          </span>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount received</span>
          <Input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
          <div className="mt-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => setAmount(String(Math.round(outstanding * rate)))}
              className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-accent"
            >
              Full
            </button>
            <button
              type="button"
              onClick={() => setAmount(String(Math.round((outstanding * rate) / 2)))}
              className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-accent"
            >
              Half
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Payment method</span>
          <Select value={mode} onChange={(e) => setMode(e.target.value as PayMode)} className="w-full">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="online">Online</option>
          </Select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Reference</span>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Txn ID / cheque no. / UTR (optional)"
          />
        </label>

        {valid && (
          <p className="text-xs text-muted-foreground">
            Marks invoice as{" "}
            <span className={cn("font-medium", willSettle ? "text-success" : "text-foreground")}>
              {willSettle ? "Paid" : "Partial"}
            </span>
            {!willSettle && (
              <>
                {" "}
                · <Money value={Math.max(0, outstanding - amtBase)} /> still due
              </>
            )}
          </p>
        )}
      </div>
    </Sheet>
  );
}

interface LineItem {
  desc: string;
  amount: string;
}

function CreateInvoiceSheet({
  open,
  onClose,
  patients,
  procedures,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  patients: PatientLite[];
  procedures: string[];
  onCreate: (p: {
    patientId: string;
    items: { desc: string; amount: number }[];
    status: InvoiceStatus;
    mode: Invoice["mode"];
  }) => void;
}) {
  const { currency } = usePrefs();
  const rate = currency.rate || 1;
  const [patientId, setPatientId] = React.useState(patients[0]?.id ?? "");
  const [mode, setMode] = React.useState<Invoice["mode"]>("upi");
  const [status, setStatus] = React.useState<InvoiceStatus>("paid");
  const [items, setItems] = React.useState<LineItem[]>([{ desc: "", amount: "" }]);

  // reset whenever the sheet is reopened
  React.useEffect(() => {
    if (open) {
      setPatientId(patients[0]?.id ?? "");
      setMode("upi");
      setStatus("paid");
      setItems([{ desc: "", amount: "" }]);
    }
  }, [open, patients]);

  // amounts typed in the active currency → base = entered / rate
  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0) / rate;
  const valid = patientId && items.some((i) => i.desc.trim() && parseFloat(i.amount) > 0);

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Create invoice"
      description="Bill a patient for procedures rendered"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() =>
              onCreate({
                patientId,
                mode,
                status,
                items: items
                  .filter((i) => i.desc.trim() && parseFloat(i.amount) > 0)
                  .map((i) => ({ desc: i.desc.trim(), amount: parseFloat(i.amount) / rate })),
              })
            }
          >
            <Receipt className="size-4" /> Save invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Patient</span>
          <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full">
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Line items</span>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { desc: "", amount: "" }])}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="size-3.5" /> Add line
            </button>
          </div>
          <datalist id="procedure-options">
            {procedures.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  list="procedure-options"
                  placeholder="Procedure / description"
                  value={it.desc}
                  onChange={(e) => updateItem(i, { desc: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={it.amount}
                  onChange={(e) => updateItem(i, { amount: e.target.value })}
                  className="w-24"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Payment mode</span>
            <Select value={mode} onChange={(e) => setMode(e.target.value as Invoice["mode"])} className="w-full">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="online">Online</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)} className="w-full">
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </Select>
          </label>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-lg font-bold tabular-nums">
            <Money value={total} />
          </span>
        </div>
      </div>
    </Sheet>
  );
}
