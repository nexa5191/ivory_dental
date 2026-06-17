"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Package,
  Clock,
  CheckCircle2,
  Trophy,
  Send,
  FileText,
  Wallet,
  ReceiptText,
  Truck,
} from "lucide-react";
import type { Vendor, Quote, RfqItem, RfqStatus, PurchaseOrder, POStatus } from "@/lib/vendors";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { cn, formatDate as fmt } from "@/lib/utils";

interface PortalRfq {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  status: RfqStatus;
  items: RfqItem[];
  notes?: string;
  myQuote: Quote | null;
  awardedToMe: boolean;
  poId?: string;
}

interface PortalData {
  vendor: Vendor;
  rfqs: PortalRfq[];
  pos: PurchaseOrder[];
}

const PO_BADGE: Record<POStatus, { label: string; variant: "default" | "good" | "low" | "muted" }> = {
  issued: { label: "Ordered", variant: "low" },
  partial: { label: "Partially received", variant: "low" },
  received: { label: "Received", variant: "default" },
  invoiced: { label: "Invoice submitted", variant: "default" },
  paid: { label: "Paid", variant: "good" },
  closed: { label: "Closed", variant: "muted" },
};

export function VendorPortalClient({ token, data }: { token: string; data: PortalData }) {
  const { vendor, rfqs, pos } = data;
  const openRfqs = rfqs.filter((r) => r.status !== "awarded" || r.awardedToMe);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* portal header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <p className="font-bold leading-tight">Ivory Dental Suite</p>
              <p className="text-xs text-muted-foreground">Vendor Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{vendor.name}</p>
            <Badge variant="muted">{vendor.category}</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          Welcome, <span className="font-medium text-foreground">{vendor.contact || vendor.name}</span>. Review
          requests for quotes, submit your bids, and track your purchase orders below.
        </p>

        {/* RFQs */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Requests for quote
          </h2>
          <div className="space-y-3">
            {openRfqs.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No open requests right now.
              </Card>
            )}
            {openRfqs.map((r) => (
              <RfqCard key={r.id} rfq={r} token={token} />
            ))}
          </div>
        </section>

        {/* POs */}
        {pos.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Your purchase orders
            </h2>
            <div className="space-y-2">
              {pos.map((po) => {
                const b = PO_BADGE[po.status];
                return (
                  <Card key={po.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">{po.id}</span>
                        <p className="font-medium">{po.rfqTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">
                          <Money value={po.total} />
                        </p>
                        <Badge variant={b.variant}>{b.label}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="size-3.5" />
                        {po.receipts.length ? `Received ${fmt(po.receipts[po.receipts.length - 1].date)}` : "Awaiting receipt"}
                      </span>
                      <span className="flex items-center gap-1">
                        <ReceiptText className="size-3.5" />
                        {po.invoice ? `Invoice ${po.invoice.number}` : "Invoice pending"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="size-3.5" />
                        {po.payment ? `Paid via ${po.payment.mode}` : "Payment pending"}
                      </span>
                      <a
                        href={`/vendors/po/${po.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <FileText className="size-3.5" /> View PO
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <p className="pt-4 text-center text-xs text-muted-foreground">
          This is your private vendor link for Ivory Dental Suite. Do not share it.
        </p>
      </main>
    </div>
  );
}

function RfqCard({ rfq, token }: { rfq: PortalRfq; token: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [prices, setPrices] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    rfq.items.forEach((it) => (init[it.name] = rfq.myQuote?.lines.find((l) => l.itemName === it.name)?.unitPrice ?? 0));
    return init;
  });
  const [lead, setLead] = React.useState(rfq.myQuote?.leadTimeDays ?? 7);
  const [validity, setValidity] = React.useState(rfq.myQuote?.validityDays ?? 15);
  const [notes, setNotes] = React.useState(rfq.myQuote?.notes ?? "");
  const [busy, setBusy] = React.useState(false);

  const total = rfq.items.reduce((s, it) => s + (Number(prices[it.name]) || 0) * it.qty, 0);
  const canSubmit = rfq.items.every((it) => (Number(prices[it.name]) || 0) > 0);

  async function submit() {
    setBusy(true);
    await fetch(`/api/vendor-portal/${token}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rfqId: rfq.id,
        lines: rfq.items.map((it) => ({ itemName: it.name, unitPrice: Number(prices[it.name]) || 0 })),
        leadTimeDays: Number(lead),
        validityDays: Number(validity),
        notes,
      }),
    });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{rfq.id}</span>
            <Badge variant="muted">{rfq.category}</Badge>
          </div>
          <p className="mt-1 font-semibold">{rfq.title}</p>
          <p className="text-xs text-muted-foreground">Received {fmt(rfq.createdAt)}</p>
        </div>
        {rfq.awardedToMe ? (
          <Badge variant="good">
            <Trophy className="size-3" /> Awarded · {rfq.poId}
          </Badge>
        ) : rfq.myQuote ? (
          <Badge variant="default">
            <CheckCircle2 className="size-3" /> Quote submitted
          </Badge>
        ) : (
          <Badge variant="low">
            <Clock className="size-3" /> Awaiting your quote
          </Badge>
        )}
      </div>

      <ul className="mt-3 divide-y rounded-md border text-sm">
        {rfq.items.map((it) => (
          <li key={it.name} className="flex items-center justify-between px-3 py-2">
            <span className="flex items-center gap-2">
              <Package className="size-3.5 text-muted-foreground" /> {it.name}
            </span>
            <span className="text-muted-foreground">
              {it.qty} {it.unit}
            </span>
          </li>
        ))}
      </ul>
      {rfq.notes && <p className="mt-2 text-xs text-muted-foreground">Note: {rfq.notes}</p>}

      {rfq.myQuote && (
        <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
          Your quote: <span className="font-semibold"><Money value={rfq.myQuote.total} /></span> · lead{" "}
          {rfq.myQuote.leadTimeDays} days · valid {rfq.myQuote.validityDays} days
        </p>
      )}

      {!rfq.awardedToMe && (
        <>
          {!open ? (
            <Button variant={rfq.myQuote ? "outline" : "default"} className="mt-3" onClick={() => setOpen(true)}>
              <Send className="size-4" /> {rfq.myQuote ? "Revise quote" : "Submit quote"}
            </Button>
          ) : (
            <div className="mt-3 rounded-md border bg-muted/30 p-3">
              <p className="mb-2 text-sm font-semibold">Enter your bid</p>
              <div className="space-y-2">
                {rfq.items.map((it) => (
                  <div key={it.name} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {it.name} <span className="text-muted-foreground">× {it.qty}</span>
                    </span>
                    <Input
                      type="number"
                      className="w-24"
                      placeholder="unit price"
                      value={String(prices[it.name] ?? 0)}
                      onChange={(e) => setPrices((p) => ({ ...p, [it.name]: Number(e.target.value) }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Lead time (days)</span>
                  <Input type="number" value={String(lead)} onChange={(e) => setLead(Number(e.target.value))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Quote valid (days)</span>
                  <Input type="number" value={String(validity)} onChange={(e) => setValidity(Number(e.target.value))} />
                </label>
              </div>
              <Input
                className="mt-2"
                placeholder="Notes (terms, GST, shipping…)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Total <Money value={total} />
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={submit} disabled={busy || !canSubmit}>
                    {busy ? "Submitting…" : "Submit bid"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
