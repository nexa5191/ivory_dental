"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Send,
  Mail,
  MessageSquare,
  Trash2,
  Package,
  Users,
  FileText,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Store,
  Inbox,
  Wallet,
  FilePlus2,
} from "lucide-react";
import type { Vendor, Rfq, RfqItem, QuoteLine, Channel, RfqStatus, PurchaseOrder, POStatus, VendorCategory } from "@/lib/vendors";
import { VENDOR_CATEGORIES } from "@/lib/vendors";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Money } from "@/components/ui/money";
import { PODetailSheet, ManualPurchaseSheet } from "@/components/clinic/po-detail";
import { cn } from "@/lib/utils";

interface Metrics {
  vendors: number;
  openRequests: number;
  awaitingQuotes: number;
  purchaseOrders: number;
  poValue: number;
  payablesDue: number;
}

const PO_BADGE: Record<POStatus, { label: string; variant: "default" | "good" | "low" | "muted" }> = {
  issued: { label: "Issued", variant: "low" },
  partial: { label: "Partially received", variant: "low" },
  received: { label: "Received", variant: "default" },
  invoiced: { label: "Invoiced", variant: "default" },
  paid: { label: "Paid", variant: "good" },
  closed: { label: "Closed", variant: "muted" },
};

const STATUS_BADGE: Record<RfqStatus, { label: string; variant: "default" | "good" | "low" | "muted" }> = {
  draft: { label: "Draft", variant: "muted" },
  sent: { label: "Sent · awaiting quotes", variant: "low" },
  quoted: { label: "Quotes received", variant: "default" },
  awarded: { label: "Awarded", variant: "good" },
};

const CHANNEL_LABEL: Record<Channel, string> = { email: "Email", sms: "SMS", both: "Email + SMS" };

export function ProcurementClient({
  rfqs,
  vendors,
  pos,
  metrics,
}: {
  rfqs: Rfq[];
  vendors: Vendor[];
  pos: PurchaseOrder[];
  metrics: Metrics;
}) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [creatingManual, setCreatingManual] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedPoId, setSelectedPoId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "open" | "awaiting" | "po" | "payables">("all");

  const vendorMap = React.useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);
  const selected = rfqs.find((r) => r.id === selectedId) ?? null;
  const selectedPo = pos.find((p) => p.id === selectedPoId) ?? null;
  const toggle = (f: typeof filter) => setFilter((cur) => (cur === f ? "all" : f));

  const showRfqs = filter === "all" || filter === "open" || filter === "awaiting";
  const showPos = filter === "all" || filter === "po" || filter === "payables";
  const shownRfqs =
    filter === "open"
      ? rfqs.filter((r) => r.status === "sent" || r.status === "quoted")
      : filter === "awaiting"
        ? rfqs.filter((r) => r.status === "sent")
        : rfqs;
  const shownPos = filter === "payables" ? pos.filter((p) => p.status === "invoiced") : pos;

  return (
    <>
      {/* KPI strip — click to filter */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          icon={<Store className="size-4" />}
          label="Active vendors"
          value={String(metrics.vendors)}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <Kpi
          icon={<Inbox className="size-4" />}
          label="Open requests"
          value={String(metrics.openRequests)}
          active={filter === "open"}
          onClick={() => toggle("open")}
        />
        <Kpi
          icon={<Clock className="size-4" />}
          label="Awaiting quotes"
          value={String(metrics.awaitingQuotes)}
          active={filter === "awaiting"}
          onClick={() => toggle("awaiting")}
        />
        <Kpi
          icon={<ShoppingCart className="size-4" />}
          label="PO value"
          value={<Money value={metrics.poValue} compact />}
          active={filter === "po"}
          onClick={() => toggle("po")}
        />
        <Kpi
          icon={<Wallet className="size-4" />}
          label="Payables due"
          value={<Money value={metrics.payablesDue} compact />}
          active={filter === "payables"}
          onClick={() => toggle("payables")}
        />
      </div>

      {showRfqs && (
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Material & equipment requests
        </h2>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> New request
        </Button>
      </div>
      )}

      {showRfqs && (
      <div className="space-y-3">
        {shownRfqs.map((r) => {
          const sb = STATUS_BADGE[r.status];
          return (
            <Card
              key={r.id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              onClick={() => setSelectedId(r.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                    <Badge>{r.category}</Badge>
                  </div>
                  <p className="mt-1 font-semibold">{r.title}</p>
                </div>
                <Badge variant={sb.variant}>{sb.label}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="size-3.5" /> {r.items.length} item{r.items.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> {r.vendorIds.length} vendor{r.vendorIds.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="size-3.5" /> {r.quotes.length} quote{r.quotes.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  {r.channel === "sms" ? <MessageSquare className="size-3.5" /> : <Mail className="size-3.5" />}
                  {CHANNEL_LABEL[r.channel]}
                </span>
              </div>
            </Card>
          );
        })}
        {shownRfqs.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {filter === "all" ? "No requests yet. Raise one with “New request”." : "No requests in this filter."}
          </p>
        )}
      </div>
      )}

      {/* Purchase orders */}
      {showPos && (
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Purchase orders{filter === "payables" ? " · payables" : ""}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setCreatingManual(true)}>
          <FilePlus2 className="size-4" /> Direct purchase
        </Button>
      </div>
      )}
      {showPos && (
      <div className="space-y-2">
        {shownPos.map((po) => {
          const b = PO_BADGE[po.status];
          return (
            <Card
              key={po.id}
              className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4 transition-shadow hover:shadow-md"
              onClick={() => setSelectedPoId(po.id)}
            >
              <div>
                <span className="font-mono text-xs text-muted-foreground">{po.id}</span>
                {po.manual && <Badge variant="muted" className="ml-2">Direct</Badge>}
                <p className="font-medium">{po.rfqTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {vendorMap.get(po.vendorId)?.name ?? po.vendorId}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">
                  <Money value={po.total} />
                </p>
                <Badge variant={b.variant}>{b.label}</Badge>
              </div>
            </Card>
          );
        })}
        {shownPos.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {filter === "payables"
              ? "No outstanding payables."
              : "No purchase orders yet. Award a quote above, or record a direct purchase."}
          </p>
        )}
      </div>
      )}

      <RfqDetailSheet
        rfq={selected}
        vendorMap={vendorMap}
        onClose={() => setSelectedId(null)}
        onChanged={() => router.refresh()}
      />

      <PODetailSheet
        po={selectedPo}
        vendorName={selectedPo ? vendorMap.get(selectedPo.vendorId)?.name ?? selectedPo.vendorId : ""}
        onClose={() => setSelectedPoId(null)}
        onChanged={() => router.refresh()}
      />

      <NewRequestSheet
        open={creating}
        vendors={vendors}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          router.refresh();
        }}
      />

      <ManualPurchaseSheet
        open={creatingManual}
        vendors={vendors}
        onClose={() => setCreatingManual(false)}
        onCreated={() => {
          setCreatingManual(false);
          router.refresh();
        }}
      />
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 text-left transition-all",
        onClick && "cursor-pointer hover:shadow-md",
        active && "ring-2 ring-primary"
      )}
    >
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </Card>
  );
}

function RfqDetailSheet({
  rfq,
  vendorMap,
  onClose,
  onChanged,
}: {
  rfq: Rfq | null;
  vendorMap: Map<string, Vendor>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  // per-line allocations for the award form; defaults to the whole qty at the
  // cheapest vendor's quoted price (one allocation per line).
  const [alloc, setAlloc] = React.useState<Record<string, Alloc[]>>({});

  React.useEffect(() => {
    setFlash(null);
    if (rfq && rfq.quotes.length) {
      const init: Record<string, Alloc[]> = {};
      rfq.items.forEach((it) => {
        let best: string | null = null;
        let bestPrice = Infinity;
        rfq.quotes.forEach((q) => {
          const l = q.lines.find((x) => x.itemName === it.name);
          if (l && l.unitPrice < bestPrice) {
            bestPrice = l.unitPrice;
            best = q.vendorId;
          }
        });
        init[it.name] = best ? [{ vendorId: best, qty: it.qty, unitPrice: bestPrice }] : [];
      });
      setAlloc(init);
    } else {
      setAlloc({});
    }
  }, [rfq?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rfq) return null;

  async function act(path: string, body?: unknown, msg?: string) {
    setBusy(true);
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (msg) setFlash(msg);
    onChanged();
  }

  const lowest = rfq.quotes.length
    ? Math.min(...rfq.quotes.map((q) => q.total))
    : 0;
  const pendingVendors = rfq.vendorIds.filter((id) => !rfq.quotes.some((q) => q.vendorId === id));

  return (
    <Sheet open={!!rfq} onClose={onClose} title={rfq.title} description={`${rfq.id} · ${rfq.category}`}>
      <div className="space-y-5">
        {flash && (
          <p className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-xs font-medium text-success">
            <CheckCircle2 className="size-4" /> {flash}
          </p>
        )}

        {/* items */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Requested items
          </h3>
          <ul className="divide-y rounded-md border text-sm">
            {rfq.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-2">
                <span>{it.name}</span>
                <span className="text-muted-foreground">
                  {it.qty} {it.unit}
                </span>
              </li>
            ))}
          </ul>
          {rfq.notes && <p className="mt-2 text-xs text-muted-foreground">Note: {rfq.notes}</p>}
        </section>

        {/* invited vendors */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sent to · {CHANNEL_LABEL[rfq.channel]}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {rfq.vendorIds.map((id) => {
              const quoted = rfq.quotes.some((q) => q.vendorId === id);
              return (
                <Badge key={id} variant={quoted ? "good" : "muted"}>
                  {quoted && <CheckCircle2 className="size-3" />}
                  {vendorMap.get(id)?.name ?? id}
                </Badge>
              );
            })}
            {rfq.vendorIds.length === 0 && (
              <span className="text-xs text-muted-foreground">No vendors invited.</span>
            )}
          </div>
        </section>

        {/* quote comparison — side by side, with per-line split award */}
        {rfq.quotes.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quote comparison
            </h3>

            {/* vendor totals (read-only) */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[...rfq.quotes]
                .sort((a, b) => a.total - b.total)
                .map((q) => {
                  const v = vendorMap.get(q.vendorId);
                  return (
                    <span
                      key={q.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                        q.total === lowest && "border-primary/40 bg-primary/5 text-primary"
                      )}
                      title={`Lead ${q.leadTimeDays}d · valid ${q.validityDays}d${q.notes ? ` · ${q.notes}` : ""}`}
                    >
                      {q.total === lowest && <Trophy className="size-3" />}
                      {v?.name ?? q.vendorId}: <Money value={q.total} />
                    </span>
                  );
                })}
            </div>

            {rfq.status === "awarded" ? (
              <div className="space-y-1.5">
                {(rfq.awards ?? []).map((a) => (
                  <p key={a.poId} className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle2 className="mr-1 inline size-4" />
                    <span className="font-mono font-semibold">{a.poId}</span> →{" "}
                    {vendorMap.get(a.vendorId)?.name ?? a.vendorId}
                  </p>
                ))}
              </div>
            ) : (
              <AllocationAward rfq={rfq} vendorMap={vendorMap} alloc={alloc} setAlloc={setAlloc} busy={busy} act={act} />
            )}
          </section>
        )}

        {/* actions */}
        {rfq.status === "draft" && (
          <Button
            className="w-full"
            disabled={busy || rfq.vendorIds.length === 0}
            onClick={() =>
              act(`/api/procurement/rfqs/${rfq.id}/send`, undefined, `Request sent via ${CHANNEL_LABEL[rfq.channel]}.`)
            }
          >
            <Send className="size-4" /> Send to {rfq.vendorIds.length} vendor
            {rfq.vendorIds.length !== 1 ? "s" : ""}
          </Button>
        )}

        {(rfq.status === "sent" || (rfq.status === "quoted" && pendingVendors.length > 0)) && (
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() =>
              act(
                `/api/procurement/rfqs/${rfq.id}/quotes`,
                undefined,
                `${pendingVendors.length} vendor quote${pendingVendors.length !== 1 ? "s" : ""} received.`
              )
            }
          >
            <Sparkles className="size-4" /> Simulate vendor replies ({pendingVendors.length} pending)
          </Button>
        )}
      </div>
    </Sheet>
  );
}

interface Alloc {
  vendorId: string;
  qty: number;
  unitPrice: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

// Award form: allocate each line's quantity across one or more vendors, with an
// editable (renegotiated) unit rate per allocation. Generates one PO per vendor.
function AllocationAward({
  rfq,
  vendorMap,
  alloc,
  setAlloc,
  busy,
  act,
}: {
  rfq: Rfq;
  vendorMap: Map<string, Vendor>;
  alloc: Record<string, Alloc[]>;
  setAlloc: React.Dispatch<React.SetStateAction<Record<string, Alloc[]>>>;
  busy: boolean;
  act: (path: string, body?: unknown, msg?: string) => void;
}) {
  const quotesFor = (itemName: string) =>
    rfq.quotes
      .map((q) => ({ vendorId: q.vendorId, line: q.lines.find((l) => l.itemName === itemName) }))
      .filter((x): x is { vendorId: string; line: QuoteLine } => !!x.line);
  const quotePrice = (itemName: string, vendorId: string) =>
    rfq.quotes.find((q) => q.vendorId === vendorId)?.lines.find((l) => l.itemName === itemName)?.unitPrice ?? 0;

  const setRows = (itemName: string, rows: Alloc[]) => setAlloc((p) => ({ ...p, [itemName]: rows }));
  const updateRow = (itemName: string, idx: number, patch: Partial<Alloc>) =>
    setRows(itemName, (alloc[itemName] ?? []).map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRow = (itemName: string, idx: number) =>
    setRows(itemName, (alloc[itemName] ?? []).filter((_, i) => i !== idx));
  const addRow = (it: RfqItem) => {
    const rows = alloc[it.name] ?? [];
    const used = new Set(rows.map((r) => r.vendorId));
    const next = quotesFor(it.name).find((x) => !used.has(x.vendorId));
    if (!next) return;
    const allocated = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const remaining = Math.max(0, it.qty - allocated);
    setRows(it.name, [...rows, { vendorId: next.vendorId, qty: remaining, unitPrice: next.line.unitPrice }]);
  };

  const allocatedOf = (it: RfqItem) => (alloc[it.name] ?? []).reduce((s, r) => s + (Number(r.qty) || 0), 0);
  const overAllocated = rfq.items.some((it) => allocatedOf(it) > it.qty + 1e-6);
  const anyAllocation = rfq.items.some((it) => (alloc[it.name] ?? []).some((r) => r.vendorId && (Number(r.qty) || 0) > 0));

  // PO preview grouped by vendor
  const byVendor = new Map<string, number>();
  rfq.items.forEach((it) =>
    (alloc[it.name] ?? []).forEach((r) => {
      const q = Number(r.qty) || 0;
      const up = Number(r.unitPrice) || 0;
      if (r.vendorId && q > 0) byVendor.set(r.vendorId, (byVendor.get(r.vendorId) ?? 0) + q * up);
    })
  );
  const vendorCount = byVendor.size;

  const flatAllocations = () =>
    rfq.items.flatMap((it) =>
      (alloc[it.name] ?? [])
        .filter((r) => r.vendorId && (Number(r.qty) || 0) > 0)
        .map((r) => ({ itemName: it.name, vendorId: r.vendorId, qty: Number(r.qty), unitPrice: Number(r.unitPrice) }))
    );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Allocate each line&apos;s quantity to one or more vendors — split the qty and{" "}
        <span className="font-medium text-foreground">override the rate</span> if you renegotiated.
      </p>
      {rfq.items.map((it) => {
        const rows = alloc[it.name] ?? [];
        const remaining = r2(it.qty - allocatedOf(it));
        const canAdd = rows.length < quotesFor(it.name).length;
        return (
          <div key={it.name} className="rounded-md border p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{it.name}</span>
              <span className={cn("text-xs", remaining < 0 ? "font-medium text-danger" : "text-muted-foreground")}>
                {it.qty} {it.unit}
                {remaining > 0 && ` · ${remaining} unallocated`}
                {remaining < 0 && ` · ${-remaining} over-allocated`}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {rows.map((r, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <Select
                    value={r.vendorId}
                    onChange={(e) => updateRow(it.name, idx, { vendorId: e.target.value, unitPrice: quotePrice(it.name, e.target.value) })}
                    className="h-8 flex-1 text-xs"
                  >
                    {quotesFor(it.name).map((x) => (
                      <option key={x.vendorId} value={x.vendorId}>
                        {vendorMap.get(x.vendorId)?.name ?? x.vendorId} (quoted {x.line.unitPrice})
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number" min="0" value={r.qty}
                    onChange={(e) => updateRow(it.name, idx, { qty: Number(e.target.value) })}
                    className="h-8 w-16 text-xs" title="Quantity"
                  />
                  <Input
                    type="number" min="0" step="0.01" value={r.unitPrice}
                    onChange={(e) => updateRow(it.name, idx, { unitPrice: Number(e.target.value) })}
                    className="h-8 w-20 text-xs" title="Unit price (override to renegotiate)"
                  />
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(it.name, idx)} className="p-1 text-muted-foreground hover:text-danger" aria-label="Remove allocation">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canAdd && (
              <button type="button" onClick={() => addRow(it)} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                <Plus className="size-3" /> Split to another vendor
              </button>
            )}
          </div>
        );
      })}

      {/* resulting POs preview */}
      {vendorCount > 0 && (
        <div className="rounded-md border bg-muted/30 p-2.5 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {vendorCount > 1 ? `${vendorCount} purchase orders (split)` : "1 purchase order"}
          </p>
          {Array.from(byVendor.entries()).map(([vid, total]) => (
            <div key={vid} className="flex justify-between">
              <span>{vendorMap.get(vid)?.name ?? vid}</span>
              <span className="font-semibold tabular-nums">
                <Money value={total} />
              </span>
            </div>
          ))}
        </div>
      )}

      <Button
        className="w-full"
        disabled={busy || !anyAllocation || overAllocated}
        onClick={() =>
          act(
            `/api/procurement/rfqs/${rfq.id}/award-alloc`,
            { allocations: flatAllocations() },
            vendorCount > 1 ? `Split award — ${vendorCount} POs raised.` : "Awarded & PO raised."
          )
        }
      >
        <Trophy className="size-3.5" /> Award &amp; raise PO{vendorCount > 1 ? "s" : ""}
      </Button>
      {overAllocated && <p className="text-center text-[11px] text-danger">A line is over-allocated — reduce the split quantities.</p>}
    </div>
  );
}

interface DraftItem {
  name: string;
  qty: number;
  unit: string;
}

function NewRequestSheet({
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
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<VendorCategory>(VENDOR_CATEGORIES[0]);
  const [channel, setChannel] = React.useState<Channel>("email");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<DraftItem[]>([{ name: "", qty: 1, unit: "units" }]);
  const [picked, setPicked] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setCategory(VENDOR_CATEGORIES[0]);
      setChannel("email");
      setNotes("");
      setItems([{ name: "", qty: 1, unit: "units" }]);
      setPicked([]);
    }
  }, [open]);

  // suggest vendors matching the chosen category first, then the rest
  const matching = vendors.filter((v) => v.active && v.category === category);
  const others = vendors.filter((v) => v.active && v.category !== category);

  const setItem = (i: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, { name: "", qty: 1, unit: "units" }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const togglePick = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const valid = title.trim() && items.some((it) => it.name.trim());

  async function submit(send: boolean) {
    if (!valid) return;
    setBusy(true);
    await fetch("/api/procurement/rfqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        channel,
        notes,
        items: items.filter((it) => it.name.trim()),
        vendorIds: picked,
        send,
      }),
    });
    setBusy(false);
    onCreated();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New material request"
      description="Raise an RFQ and send it to registered vendors"
      footer={
        <>
          <Button variant="outline" onClick={() => submit(false)} disabled={busy || !valid}>
            Save draft
          </Button>
          <Button onClick={() => submit(true)} disabled={busy || !valid || picked.length === 0}>
            <Send className="size-4" /> Send request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Request title">
          <Input
            autoFocus
            placeholder="Restorative consumables — June restock"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)} className="w-full">
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Send via">
            <Select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="w-full">
              <option value="email">Email</option>
              <option value="sms">SMS / Text</option>
              <option value="both">Email + SMS</option>
            </Select>
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Items needed</span>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="Item / equipment"
                  value={it.name}
                  onChange={(e) => setItem(i, { name: e.target.value })}
                />
                <Input
                  type="number"
                  min="1"
                  className="w-16"
                  value={String(it.qty)}
                  onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
                />
                <Input
                  className="w-20"
                  placeholder="unit"
                  value={it.unit}
                  onChange={(e) => setItem(i, { unit: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                  title="Remove"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={addItem}>
            <Plus className="size-3.5" /> Add item
          </Button>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Send to vendors {picked.length > 0 && `(${picked.length} selected)`}
          </span>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1.5">
            {[...matching, ...others].map((v) => (
              <label
                key={v.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(v.id)}
                  onChange={() => togglePick(v.id)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="flex-1">{v.name}</span>
                <Badge variant={v.category === category ? "default" : "muted"}>{v.category}</Badge>
              </label>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            “Save draft” keeps it unsent. “Send request” notifies the selected vendors by{" "}
            {CHANNEL_LABEL[channel].toLowerCase()}.
          </p>
        </div>

        <Field label="Notes (optional)">
          <Input
            placeholder="Delivery location, deadline, specs…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
