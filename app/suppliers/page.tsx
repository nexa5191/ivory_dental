import { Mail, Clock, Star, Plus, Package } from "lucide-react";
import { suppliers, listProducts } from "@/lib/store";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SuppliersPage() {
  const products = listProducts();

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Suppliers" subtitle={`${suppliers.length} active supplier relationships`}>
        <Button>
          <Plus className="size-4" /> Add supplier
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => {
          const linked = products.filter((p) => p.supplierId === s.id);
          return (
            <Card key={s.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-3.5"
                        fill={i < s.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4" /> {s.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4" /> {s.leadTimeDays}-day lead time
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="size-4" /> {linked.length} products supplied
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {linked.slice(0, 4).map((p) => (
                    <Badge key={p.id} variant="muted">
                      {p.name.split(" ")[0]}
                    </Badge>
                  ))}
                  {linked.length > 4 && <Badge variant="muted">+{linked.length - 4}</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
