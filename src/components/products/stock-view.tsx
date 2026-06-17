"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Ban } from "lucide-react";
import type { Movement } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockActions, type StockProduct } from "@/components/products/stock-actions";
import { relativeTime } from "@/lib/utils";

const meta = {
  in: { label: "Received", icon: ArrowDownToLine, cls: "bg-success/10 text-success", sign: "+" },
  out: { label: "Consumed", icon: ArrowUpFromLine, cls: "bg-danger/10 text-danger", sign: "−" },
  writeoff: { label: "Written off", icon: Ban, cls: "bg-warning/15 text-warning", sign: "−" },
  transfer: { label: "Transfer", icon: ArrowLeftRight, cls: "bg-primary/10 text-primary", sign: "⇄ " },
};

export function StockView({
  movements,
  products,
  warehouses,
}: {
  movements: Movement[];
  products: StockProduct[];
  warehouses: string[];
}) {
  const byId = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Consumption, receipts, write-offs, and transfers</p>
        <div className="flex gap-2">
          <StockActions products={products} warehouses={warehouses} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movement log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[34rem] divide-y overflow-y-auto scrollbar-thin">
              {movements.map((m) => {
                const info = meta[m.type];
                const Icon = info.icon;
                const product = byId.get(m.productId);
                return (
                  <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                    <div className={`flex size-9 items-center justify-center rounded-lg ${info.cls}`}>
                      <Icon className="size-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product?.name ?? m.productId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {info.label} · {m.ref}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {info.sign}
                      {m.qty}
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                      {relativeTime(m.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warehouses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warehouses.map((w, i) => (
              <div key={w} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{w}</p>
                  <Badge variant="muted">{["62%", "48%", "21%"][i] ?? "—"}</Badge>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: ["62%", "48%", "21%"][i] ?? "0%" }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">capacity used</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
