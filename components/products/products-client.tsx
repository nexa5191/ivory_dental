"use client";

import * as React from "react";
import {
  Plus,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Product, Supplier } from "@/lib/mock-data";
import { CATEGORIES, WAREHOUSES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { cn, formatCurrency } from "@/lib/utils";

type SortKey = "name" | "stock" | "value" | "sku";

function status(p: Product): "good" | "low" | "out" {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.reorderPoint) return "low";
  return "good";
}

const statusLabel = { good: "In stock", low: "Low", out: "Out" } as const;

export function ProductsClient({
  initialProducts,
  suppliers,
}: {
  initialProducts: Product[];
  suppliers: Supplier[];
}) {
  const [products, setProducts] = React.useState(initialProducts);
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [editing, setEditing] = React.useState<Product | "new" | null>(null);

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—";

  const filtered = React.useMemo(() => {
    let list = products.filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.sku.toLowerCase().includes(q.toLowerCase());
      const matchesCat = category === "all" || p.category === category;
      const matchesStatus = statusFilter === "all" || status(p) === statusFilter;
      return matchesQ && matchesCat && matchesStatus;
    });
    list = [...list].sort((a, b) => {
      const dir = sort.dir;
      switch (sort.key) {
        case "stock":
          return (a.stock - b.stock) * dir;
        case "value":
          return (a.stock * a.cost - b.stock * b.cost) * dir;
        case "sku":
          return a.sku.localeCompare(b.sku) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });
    return list;
  }, [products, q, category, statusFilter, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));

  async function save(form: Partial<Product>) {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const saved: Product = await res.json();
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setEditing(null);
  }

  async function remove(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Any status</option>
          <option value="good">In stock</option>
          <option value="low">Low</option>
          <option value="out">Out</option>
        </Select>
        <div className="flex overflow-hidden rounded-md border">
          <button
            onClick={() => setView("list")}
            className={cn("p-2", view === "list" ? "bg-primary/10 text-primary" : "hover:bg-accent")}
          >
            <List className="size-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn("p-2", view === "grid" ? "bg-primary/10 text-primary" : "hover:bg-accent")}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
        {products.length} products
      </p>

      {view === "list" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <Th onClick={() => toggleSort("name")}>Product</Th>
                  <Th onClick={() => toggleSort("sku")}>SKU</Th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <Th onClick={() => toggleSort("stock")} className="text-right">
                    Stock
                  </Th>
                  <th className="px-4 py-3 text-right font-medium">Reorder</th>
                  <Th onClick={() => toggleSort("value")} className="text-right">
                    Value
                  </Th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = status(p);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setEditing(p)}
                      className={cn(
                        "cursor-pointer border-b transition-colors last:border-0 hover:bg-accent/50",
                        st === "out" && "bg-danger/[0.03]",
                        st === "low" && "bg-warning/[0.04]"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{p.emoji}</span>
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-3">
                        <Badge variant="muted">{p.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{p.stock}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {p.reorderPoint}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCurrency(p.stock * p.cost)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={st}>{statusLabel[st]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <Pencil className="size-4" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const st = status(p);
            return (
              <Card
                key={p.id}
                onClick={() => setEditing(p)}
                className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{p.emoji}</span>
                  <Badge variant={st}>{statusLabel[st]}</Badge>
                </div>
                <p className="mt-3 font-medium leading-tight">{p.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{p.stock}</p>
                    <p className="text-xs text-muted-foreground">in stock</p>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(p.stock * p.cost)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ProductSheet
        editing={editing}
        suppliers={suppliers}
        supplierName={supplierName}
        onClose={() => setEditing(null)}
        onSave={save}
        onDelete={remove}
      />

      {/* Floating add button anchor handled by parent header button via event */}
      <button id="add-product-trigger" hidden onClick={() => setEditing("new")} />
    </div>
  );
}

function Th({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-3 font-medium", className)}>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <ArrowUpDown className="size-3" />
      </button>
    </th>
  );
}

function ProductSheet({
  editing,
  suppliers,
  supplierName,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Product | "new" | null;
  suppliers: Supplier[];
  supplierName: (id: string) => string;
  onClose: () => void;
  onSave: (form: Partial<Product>) => void;
  onDelete: (id: string) => void;
}) {
  const isNew = editing === "new";
  const product = editing && editing !== "new" ? editing : null;
  const [form, setForm] = React.useState<Partial<Product>>({});

  React.useEffect(() => {
    if (product) setForm(product);
    else if (isNew)
      setForm({
        name: "",
        sku: "",
        category: CATEGORIES[0],
        stock: 0,
        reorderPoint: 10,
        cost: 0,
        price: 0,
        supplierId: suppliers[0]?.id,
        location: WAREHOUSES[0],
        emoji: "📦",
      });
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<Product>) => setForm((f) => ({ ...f, ...patch }));
  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <Sheet
      open={editing !== null}
      onClose={onClose}
      title={isNew ? "Add product" : product?.name}
      description={isNew ? "Create a new inventory item" : product?.sku}
      footer={
        <>
          {product && (
            <Button variant="ghost" className="mr-auto text-danger" onClick={() => onDelete(product.id)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)}>{isNew ? "Create" : "Save changes"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {product && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <span className="text-4xl">{product.emoji}</span>
            <div>
              <p className="text-sm text-muted-foreground">Current value</p>
              <p className="text-xl font-bold">{formatCurrency(product.stock * product.cost)}</p>
              <p className="text-xs text-muted-foreground">
                Supplied by {supplierName(product.supplierId)}
              </p>
            </div>
          </div>
        )}

        <Field label="Name">
          <Input value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU">
            <Input value={form.sku ?? ""} onChange={(e) => set({ sku: e.target.value })} />
          </Field>
          <Field label="Emoji">
            <Input value={form.emoji ?? ""} onChange={(e) => set({ emoji: e.target.value })} />
          </Field>
        </div>
        <Field label="Category">
          <Select value={form.category} onChange={(e) => set({ category: e.target.value })} className="w-full">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock on hand">
            <Input
              type="number"
              value={form.stock ?? 0}
              onChange={(e) => set({ stock: num(e.target.value) })}
            />
          </Field>
          <Field label="Reorder point">
            <Input
              type="number"
              value={form.reorderPoint ?? 0}
              onChange={(e) => set({ reorderPoint: num(e.target.value) })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit cost ($)">
            <Input
              type="number"
              step="0.01"
              value={form.cost ?? 0}
              onChange={(e) => set({ cost: num(e.target.value) })}
            />
          </Field>
          <Field label="Sale price ($)">
            <Input
              type="number"
              step="0.01"
              value={form.price ?? 0}
              onChange={(e) => set({ price: num(e.target.value) })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Supplier">
            <Select
              value={form.supplierId}
              onChange={(e) => set({ supplierId: e.target.value })}
              className="w-full"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Location">
            <Select
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
              className="w-full"
            >
              {WAREHOUSES.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </Select>
          </Field>
        </div>
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
