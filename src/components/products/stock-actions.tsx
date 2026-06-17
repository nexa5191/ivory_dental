"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, PackageMinus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface StockProduct {
  id: string;
  name: string;
  stock: number;
  location: string;
}

type MovementType = "out" | "writeoff" | "in";

const CONSUME_REASONS = [
  "Treatment use",
  "Procedure consumption",
  "Issued to chair",
  "Sample / demo",
];

const WRITEOFF_REASONS = [
  "Expired — discarded",
  "Damaged / breakage",
  "Contaminated",
  "Lost / theft",
  "Recalled",
];

const TITLES: Record<MovementType, string> = {
  out: "Record consumption",
  writeoff: "Write off stock",
  in: "Receive stock",
};
const DESCRIPTIONS: Record<MovementType, string> = {
  out: "Log materials used or removed — reduces on-hand stock",
  writeoff: "Write off expired, damaged or lost stock — reduces on-hand stock",
  in: "Log a restock — increases on-hand stock",
};

export function StockActions({
  products,
  warehouses,
}: {
  products: StockProduct[];
  warehouses: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<MovementType>("out");
  const [productId, setProductId] = React.useState(products[0]?.id ?? "");
  const [location, setLocation] = React.useState(warehouses[0] ?? "");
  const [qty, setQty] = React.useState(1);
  const [reason, setReason] = React.useState(CONSUME_REASONS[0]);
  const [ref, setRef] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const product = products.find((p) => p.id === productId);
  const reasonsFor = (t: MovementType) => (t === "writeoff" ? WRITEOFF_REASONS : CONSUME_REASONS);

  function changeType(t: MovementType) {
    setType(t);
    if (t !== "in") setReason(reasonsFor(t)[0]);
  }

  function reset(t: MovementType) {
    setType(t);
    setProductId(products[0]?.id ?? "");
    setLocation(warehouses[0] ?? "");
    setQty(1);
    setReason(reasonsFor(t)[0]);
    setRef("");
    setOpen(true);
  }

  async function save() {
    if (!productId || qty <= 0) return;
    setBusy(true);
    await fetch("/api/stock/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        type,
        qty,
        location,
        ref: type === "in" ? ref || "Receipt" : reason + (ref ? ` · ${ref}` : ""),
      }),
    });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  const reducingTooMuch = type !== "in" && product && qty > product.stock;

  return (
    <>
      <Button variant="outline" onClick={() => reset("in")}>
        <Plus className="size-4" /> Receive stock
      </Button>
      <Button variant="outline" onClick={() => reset("writeoff")}>
        <Ban className="size-4" /> Write off
      </Button>
      <Button onClick={() => reset("out")}>
        <PackageMinus className="size-4" /> Record consumption
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={TITLES[type]}
        description={DESCRIPTIONS[type]}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy || !productId || qty <= 0}>
              {busy ? "Saving…" : type === "in" ? "Add stock" : type === "writeoff" ? "Write off" : "Record consumption"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* type toggle */}
          <div className="inline-flex w-full rounded-lg border bg-muted/40 p-1">
            {([
              { t: "out", label: "Consume", Icon: Minus },
              { t: "writeoff", label: "Write-off", Icon: Ban },
              { t: "in", label: "Receive", Icon: Plus },
            ] as const).map(({ t, label, Icon }) => (
              <button
                key={t}
                onClick={() => changeType(t)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium",
                  type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <Field label="Item">
            <Select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full">
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.stock} in stock
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input
                type="number"
                min="1"
                value={String(qty)}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </Field>
            <Field label="Location">
              <Select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full">
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {type !== "in" && (
            <Field label="Reason">
              <Select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full">
                {reasonsFor(type).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label={type === "in" ? "Reference / PO (optional)" : "Reference (optional)"}>
            <Input
              placeholder={type === "in" ? "e.g. PO-1044, GRN" : "e.g. patient, chair, batch no."}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </Field>

          {reducingTooMuch && (
            <p className="rounded-md bg-warning/15 px-3 py-2 text-xs font-medium text-warning">
              {type === "writeoff" ? "Writing off" : "Consuming"} {qty} but only {product?.stock} on hand — stock will be capped at 0.
            </p>
          )}
        </div>
      </Sheet>
    </>
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
