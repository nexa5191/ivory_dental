import { Plus } from "lucide-react";
import { orders } from "@/lib/store";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/mock-data";

const statusVariant: Record<Order["status"], "good" | "low" | "out" | "default" | "muted"> = {
  received: "good",
  open: "default",
  shipped: "low",
  draft: "muted",
  cancelled: "out",
};

function OrderTable({ title, list }: { title: string; list: Order[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge variant="muted">{list.length}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-2.5 font-medium">Order</th>
              <th className="px-5 py-2.5 font-medium">Party</th>
              <th className="px-5 py-2.5 font-medium">Items</th>
              <th className="px-5 py-2.5 text-right font-medium">Total</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b transition-colors last:border-0 hover:bg-accent/50">
                <td className="px-5 py-3 font-mono text-xs font-medium">{o.id}</td>
                <td className="px-5 py-3">{o.party}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {o.lines.reduce((s, l) => s + l.qty, 0)} units · {o.lines.length} line
                  {o.lines.length > 1 ? "s" : ""}
                </td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">
                  {formatCurrency(o.total)}
                </td>
                <td className="px-5 py-3">
                  <Badge variant={statusVariant[o.status]} className="capitalize">
                    {o.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const purchase = orders.filter((o) => o.type === "purchase");
  const sales = orders.filter((o) => o.type === "sales");

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Orders" subtitle="Purchase orders in, sales orders out">
        <Button variant="outline">
          <Plus className="size-4" /> Sales order
        </Button>
        <Button>
          <Plus className="size-4" /> Purchase order
        </Button>
      </PageHeader>

      <OrderTable title="Purchase orders" list={purchase} />
      <OrderTable title="Sales orders" list={sales} />
    </div>
  );
}
