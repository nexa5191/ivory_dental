// In-memory CRUD over the mock dataset. Survives across requests in dev (module
// singleton). No persistence — restarting the server resets to seed data.

import {
  products as seedProducts,
  suppliers,
  movements as seedMovements,
  orders,
  valueHistory,
  statusOf,
  WAREHOUSES,
  type Product,
  type Movement,
} from "./mock-data";

function spreadStock(total: number): Record<string, number> {
  const a = Math.round(total * 0.5);
  const b = Math.round(total * 0.3);
  return {
    [WAREHOUSES[0]]: a,
    [WAREHOUSES[1]]: b,
    [WAREHOUSES[2]]: Math.max(total - a - b, 0),
  };
}

// Clone the seed so mutations don't rewrite the imported array on hot reload.
const g = globalThis as unknown as {
  __stockly?: { products: Product[]; movements: Movement[] };
};
if (!g.__stockly) {
  g.__stockly = {
    products: seedProducts.map((p) => ({ ...p })),
    movements: seedMovements.map((m) => ({ ...m })),
  };
}
const db = g.__stockly;

export function listProducts() {
  return db.products;
}

export function getProduct(id: string) {
  return db.products.find((p) => p.id === id) ?? null;
}

export function upsertProduct(input: Partial<Product> & { id?: string }) {
  if (input.id) {
    const idx = db.products.findIndex((p) => p.id === input.id);
    if (idx >= 0) {
      const merged = { ...db.products[idx], ...input } as Product;
      if (input.stock !== undefined) merged.stockByLocation = spreadStock(merged.stock);
      db.products[idx] = merged;
      return db.products[idx];
    }
  }
  const stock = input.stock ?? 0;
  const next: Product = {
    id: `prod-${Date.now()}`,
    name: input.name ?? "Untitled",
    sku: input.sku ?? "NEW-SKU",
    category: input.category ?? "Electronics",
    stock,
    stockByLocation: input.stockByLocation ?? spreadStock(stock),
    reorderPoint: input.reorderPoint ?? 10,
    cost: input.cost ?? 0,
    price: input.price ?? 0,
    supplierId: input.supplierId ?? "sup-1",
    location: input.location ?? WAREHOUSES[0],
  };
  db.products.push(next);
  return next;
}

export function deleteProduct(id: string) {
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx >= 0) db.products.splice(idx, 1);
  return idx >= 0;
}

export function listMovements() {
  return [...db.movements].sort((a, b) => b.date.localeCompare(a.date));
}

// Record a stock movement and adjust on-hand quantity.
//   "in"       → receipt / restock      (increments stock)
//   "out"      → consumption / issue     (decrements stock)
//   "writeoff" → wastage / expiry / loss (decrements stock)
export function recordMovement(input: {
  productId: string;
  type: "in" | "out" | "writeoff";
  qty: number;
  ref?: string;
  location?: string;
}) {
  const p = getProduct(input.productId);
  const qty = Math.abs(Number(input.qty) || 0);
  if (!p || qty <= 0) return null;
  const loc =
    input.location && p.stockByLocation[input.location] !== undefined ? input.location : p.location;
  if (input.type === "in") {
    p.stock += qty;
    p.stockByLocation[loc] = (p.stockByLocation[loc] ?? 0) + qty;
  } else {
    p.stock = Math.max(0, p.stock - qty);
    p.stockByLocation[loc] = Math.max(0, (p.stockByLocation[loc] ?? 0) - qty);
  }
  const fallbackRef =
    input.type === "in" ? "Receipt" : input.type === "writeoff" ? "Write-off" : "Consumption";
  const m: Movement = {
    id: `mv-${Date.now()}`,
    productId: input.productId,
    type: input.type,
    qty,
    ref: input.ref?.trim() || fallbackRef,
    date: new Date().toISOString(),
  };
  db.movements.unshift(m);
  return { product: p, movement: m };
}

export function findProductByName(name: string) {
  const n = name.trim().toLowerCase();
  return db.products.find((p) => p.name.toLowerCase() === n) ?? null;
}

// Bridge from procurement: a GRN (goods receipt) auto-adds to inventory. Matches
// an existing item by name, otherwise creates a new consumable on first receipt.
export function receiveIntoInventory(name: string, qty: number, ref: string) {
  const n = name.trim();
  const q = Math.abs(Number(qty) || 0);
  if (!n || q <= 0) return null;
  let p = findProductByName(n);
  if (!p) {
    p = upsertProduct({ name: n, category: "Consumables", reorderPoint: 5, stock: 0 });
  }
  return recordMovement({ productId: p.id, type: "in", qty: q, ref });
}

export function getMetrics() {
  const list = db.products;
  const totalValue = list.reduce((sum, p) => sum + p.stock * p.cost, 0);
  const skus = list.length;
  const low = list.filter((p) => statusOf(p) === "low").length;
  const out = list.filter((p) => statusOf(p) === "out").length;
  const onOrder = orders.filter(
    (o) => o.type === "purchase" && (o.status === "open" || o.status === "shipped")
  );
  const onOrderValue = onOrder.reduce((s, o) => s + o.total, 0);

  const topMovers = [...db.movements]
    .reduce((acc, m) => {
      acc[m.productId] = (acc[m.productId] ?? 0) + m.qty;
      return acc;
    }, {} as Record<string, number>);
  const movers = Object.entries(topMovers)
    .map(([productId, qty]) => ({
      product: getProduct(productId)?.name ?? productId,
      qty,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return {
    totalValue,
    skus,
    low,
    out,
    onOrderCount: onOrder.length,
    onOrderValue,
    movers,
    valueHistory,
    lowStock: list
      .filter((p) => statusOf(p) !== "good")
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock, reorder: p.reorderPoint })),
  };
}

export { suppliers, orders, statusOf };
