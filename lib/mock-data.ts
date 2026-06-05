// Deterministic mock dataset for Stockly. No DB — this seeds the in-memory store.

export type ProductStatus = "good" | "low" | "out";

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  leadTimeDays: number;
  rating: number; // 1-5
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number; // total across all locations
  stockByLocation: Record<string, number>;
  reorderPoint: number;
  cost: number;
  price: number;
  supplierId: string;
  location: string; // primary location
  emoji: string;
}

export interface Movement {
  id: string;
  productId: string;
  type: "in" | "out" | "transfer" | "writeoff";
  qty: number;
  ref: string;
  date: string; // ISO
}

export interface OrderLine {
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  type: "purchase" | "sales";
  partyId: string; // supplierId for purchase
  party: string;
  status: "draft" | "open" | "shipped" | "received" | "cancelled";
  lines: OrderLine[];
  total: number;
  date: string;
}

export const CATEGORIES = [
  "Electronics",
  "Cables",
  "Hardware",
  "Packaging",
  "Office",
  "Tools",
];

export const WAREHOUSES = ["WH-1 Main", "WH-2 East", "WH-3 Returns"];

export const suppliers: Supplier[] = [
  { id: "sup-1", name: "Acme Components", contact: "Dana Lee", email: "dana@acme.co", leadTimeDays: 7, rating: 5 },
  { id: "sup-2", name: "Northwind Traders", contact: "Sam Ortiz", email: "sam@northwind.io", leadTimeDays: 14, rating: 4 },
  { id: "sup-3", name: "Globex Supply", contact: "Priya N.", email: "priya@globex.com", leadTimeDays: 4, rating: 4 },
  { id: "sup-4", name: "Initech Parts", contact: "Bill L.", email: "bill@initech.dev", leadTimeDays: 21, rating: 3 },
];

const seed = [
  ["Widget A Pro", "WGT-A", "Electronics", 342, 50, 8.5, 24.0, "sup-1", "🔧"],
  ["USB-C Cable 2m", "CBL-C2", "Cables", 2, 25, 1.2, 8.99, "sup-3", "🔌"],
  ["Bolt M4 (100pk)", "BLT-M4", "Hardware", 11, 40, 0.04, 0.3, "sup-4", "🔩"],
  ["Thermal Label Roll", "LBL-TH", "Packaging", 180, 60, 3.1, 9.5, "sup-2", "🏷️"],
  ["HDMI Adapter", "ADP-HD", "Electronics", 64, 30, 4.0, 14.99, "sup-1", "🖥️"],
  ["Gel Pen Black (12)", "PEN-GB", "Office", 420, 100, 2.2, 6.99, "sup-2", "🖊️"],
  ["Cordless Drill", "TL-DRL", "Tools", 0, 8, 42.0, 119.0, "sup-4", "🛠️"],
  ["Bubble Wrap 50m", "PKG-BW", "Packaging", 95, 40, 6.5, 18.0, "sup-3", "🎁"],
  ["Ethernet Cable Cat6", "CBL-E6", "Cables", 210, 80, 2.4, 11.5, "sup-3", "🌐"],
  ["Wireless Mouse", "EL-MSE", "Electronics", 28, 35, 6.0, 22.99, "sup-1", "🖱️"],
  ["Hex Key Set", "TL-HEX", "Tools", 47, 20, 5.5, 16.0, "sup-4", "🔑"],
  ["Shipping Box M", "PKG-BM", "Packaging", 640, 200, 0.6, 1.8, "sup-2", "📦"],
  ["Sticky Notes 3x3", "OF-STK", "Office", 312, 120, 1.1, 3.49, "sup-2", "📝"],
  ["Power Strip 6-out", "EL-PWR", "Electronics", 19, 25, 7.8, 21.0, "sup-1", "⚡"],
  ["Zip Ties (200pk)", "HW-ZIP", "Hardware", 88, 50, 1.9, 5.5, "sup-4", "➰"],
  ["Label Printer", "EL-LBP", "Electronics", 6, 5, 78.0, 189.0, "sup-1", "🖨️"],
  ["Packing Tape", "PKG-TP", "Packaging", 14, 60, 1.4, 4.25, "sup-3", "🩹"],
  ["Screwdriver Set", "TL-SDR", "Tools", 53, 25, 8.0, 23.5, "sup-4", "🪛"],
  ["Micro SD 128GB", "EL-SD1", "Electronics", 134, 50, 9.5, 27.0, "sup-1", "💾"],
  ["Whiteboard Marker", "OF-WBM", "Office", 76, 80, 0.8, 2.99, "sup-2", "🖍️"],
];

// Deterministically split a product's total stock across the 3 warehouses.
function splitStock(total: number, i: number): Record<string, number> {
  const weights = [
    [0.6, 0.3, 0.1],
    [0.34, 0.5, 0.16],
    [0.2, 0.25, 0.55],
  ][i % 3];
  const a = Math.round(total * weights[0]);
  const b = Math.round(total * weights[1]);
  const c = Math.max(total - a - b, 0);
  return { [WAREHOUSES[0]]: a, [WAREHOUSES[1]]: b, [WAREHOUSES[2]]: c };
}

export const products: Product[] = seed.map((s, i) => {
  const stock = s[3] as number;
  return {
    id: `prod-${i + 1}`,
    name: s[0] as string,
    sku: s[1] as string,
    category: s[2] as string,
    stock,
    stockByLocation: splitStock(stock, i),
    reorderPoint: s[4] as number,
    cost: s[5] as number,
    price: s[6] as number,
    supplierId: s[7] as string,
    location: WAREHOUSES[i % WAREHOUSES.length],
    emoji: s[8] as string,
  };
});

export function statusOf(p: Product): ProductStatus {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.reorderPoint) return "low";
  return "good";
}

// A fixed reference time so server renders are stable (no Math.random / Date.now in data).
const NOW = new Date("2026-06-04T15:00:00Z").getTime();
const hoursAgo = (h: number) => new Date(NOW - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(NOW - d * 86400_000).toISOString();

export const movements: Movement[] = [
  { id: "mv-1", productId: "prod-1", type: "in", qty: 120, ref: "PO-1043", date: hoursAgo(2) },
  { id: "mv-2", productId: "prod-2", type: "out", qty: 15, ref: "SO-9921", date: hoursAgo(3) },
  { id: "mv-3", productId: "prod-3", type: "transfer", qty: 40, ref: "WH1→WH2", date: hoursAgo(5) },
  { id: "mv-4", productId: "prod-10", type: "out", qty: 12, ref: "SO-9922", date: hoursAgo(7) },
  { id: "mv-5", productId: "prod-5", type: "in", qty: 50, ref: "PO-1044", date: hoursAgo(9) },
  { id: "mv-6", productId: "prod-16", type: "out", qty: 3, ref: "SO-9925", date: hoursAgo(12) },
  { id: "mv-7", productId: "prod-12", type: "in", qty: 300, ref: "PO-1045", date: daysAgo(1) },
  { id: "mv-8", productId: "prod-7", type: "out", qty: 8, ref: "SO-9930", date: daysAgo(1) },
  { id: "mv-9", productId: "prod-19", type: "in", qty: 80, ref: "PO-1046", date: daysAgo(2) },
  { id: "mv-10", productId: "prod-14", type: "out", qty: 6, ref: "SO-9931", date: daysAgo(2) },
];

export const orders: Order[] = [
  { id: "PO-1043", type: "purchase", partyId: "sup-1", party: "Acme Components", status: "received", lines: [{ productId: "prod-1", qty: 120, unitPrice: 8.5 }], total: 1020, date: daysAgo(1) },
  { id: "PO-1047", type: "purchase", partyId: "sup-3", party: "Globex Supply", status: "open", lines: [{ productId: "prod-2", qty: 200, unitPrice: 1.2 }, { productId: "prod-9", qty: 150, unitPrice: 2.4 }], total: 600, date: hoursAgo(20) },
  { id: "PO-1048", type: "purchase", partyId: "sup-4", party: "Initech Parts", status: "open", lines: [{ productId: "prod-7", qty: 20, unitPrice: 42 }], total: 840, date: hoursAgo(30) },
  { id: "PO-1049", type: "purchase", partyId: "sup-1", party: "Acme Components", status: "shipped", lines: [{ productId: "prod-16", qty: 10, unitPrice: 78 }], total: 780, date: daysAgo(3) },
  { id: "SO-9921", type: "sales", partyId: "cust-1", party: "BrightMart #14", status: "shipped", lines: [{ productId: "prod-2", qty: 15, unitPrice: 8.99 }], total: 134.85, date: hoursAgo(3) },
  { id: "SO-9930", type: "sales", partyId: "cust-2", party: "FixIt Co.", status: "open", lines: [{ productId: "prod-7", qty: 8, unitPrice: 119 }], total: 952, date: daysAgo(1) },
  { id: "SO-9932", type: "sales", partyId: "cust-3", party: "OfficeHub", status: "draft", lines: [{ productId: "prod-6", qty: 60, unitPrice: 6.99 }], total: 419.4, date: hoursAgo(6) },
];

// 12-week stock value history for the dashboard area chart.
export const valueHistory = [
  408, 415, 402, 430, 451, 442, 460, 455, 470, 466, 478, 483,
].map((v, i) => ({
  week: `W${i + 1}`,
  value: v * 1000,
}));
