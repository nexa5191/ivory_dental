// Vendor master + procurement portal — in-memory singleton mock domain.
// Flow: register vendors → raise a material/equipment request (RFQ) → send to
// chosen vendors by email/SMS → collect quotes → compare → award a purchase order.
// All money is USD base; the <Money> component converts at display time.

import { receiveIntoInventory } from "./store";

export type VendorCategory =
  | "Consumables"
  | "Equipment"
  | "Instruments"
  | "Lab Services"
  | "Pharmacy"
  | "Office Supplies";

export const VENDOR_CATEGORIES: VendorCategory[] = [
  "Consumables",
  "Equipment",
  "Instruments",
  "Lab Services",
  "Pharmacy",
  "Office Supplies",
];

export interface VendorBank {
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  branch?: string;
}

// A single GST registration (a party can hold several — one per state). The
// principal place of business address is captured per registration.
export interface GstRegistration {
  id: string;
  gstin: string;
  pan: string;
  tradeName: string;
  legalName?: string;
  label: string; // e.g. "Head Office", "Mumbai depot"
  stateCode: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  primary: boolean;
  taxpayerType?: string; // from portal: Regular / SEZ Unit / ISD / Composition
  taxpayerStatus?: string; // Active / Cancelled
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contact: string;
  email: string;
  phone: string;
  city: string;
  gstin: string;
  pan?: string; // derived from GSTIN, or entered directly
  rating: number; // 1-5
  active: boolean;
  registrations?: GstRegistration[]; // multi-GSTIN; gstin/pan/city mirror the primary
  msme?: boolean; // registered under MSME/Udyam
  udyam?: string; // Udyam Registration Number (e.g. UDYAM-KR-03-0001234)
  bank?: VendorBank;
  tds?: { section: string; rate: number }; // TDS deducted on payments (Form 26Q)
  token: string; // unique key for the vendor self-service portal link
}

export type Channel = "email" | "sms" | "both";
export type RfqStatus = "draft" | "sent" | "quoted" | "awarded";

export interface RfqItem {
  name: string;
  qty: number;
  unit: string;
}

export interface QuoteLine {
  itemName: string;
  qty: number;
  unitPrice: number; // USD
}

export interface Quote {
  id: string;
  vendorId: string;
  submittedAt: string;
  lines: QuoteLine[];
  total: number; // USD
  leadTimeDays: number;
  validityDays: number;
  notes?: string;
}

export interface Rfq {
  id: string;
  title: string;
  category: VendorCategory;
  createdAt: string;
  status: RfqStatus;
  channel: Channel;
  items: RfqItem[];
  vendorIds: string[]; // invited
  notes?: string;
  quotes: Quote[];
  awardedVendorId?: string;
  poId?: string;
  awards?: { vendorId: string; poId: string }[]; // for split (per-line) awards
}

export type POStatus = "issued" | "partial" | "received" | "invoiced" | "paid" | "closed";
export type POPayMode = "bank" | "upi" | "card" | "cheque" | "cash";

// Goods Receipt Note — one delivery event. Received qty may differ (short/over)
// from the ordered qty, and a PO can accumulate several GRNs.
export interface GRN {
  id: string;
  date: string;
  note?: string;
  // qty = billable units received (count toward the ordered balance);
  // free = bonus/free units that go into inventory but are not billed.
  lines: { itemName: string; qty: number; free?: number }[];
}

export interface POInvoice {
  number: string;
  date: string;
  amount: number; // USD
}

export interface POPayment {
  date: string;
  mode: POPayMode;
  reference?: string;
  amount: number; // USD
}

export interface PurchaseOrder {
  id: string;
  rfqId?: string; // absent for manual / direct purchases
  rfqTitle: string; // doubles as the PO title
  vendorId: string;
  date: string;
  items: QuoteLine[]; // ordered lines
  total: number; // USD
  status: POStatus;
  manual?: boolean; // true when recorded directly, bypassing the RFQ→PO flow
  receipts: GRN[];
  received: Record<string, number>; // cumulative received qty per item name
  invoice?: POInvoice;
  payment?: POPayment;
  closedReason?: string;
}

export const PO_PAY_MODES: POPayMode[] = ["bank", "upi", "card", "cheque", "cash"];

const T = new Date("2026-06-04T00:00:00Z").getTime();
const daysAgo = (d: number) => new Date(T - d * 86400000).toISOString();
const iso = () => new Date(T).toISOString();
// y, 1-based month, day → ISO; spreads seed purchases across months & FYs.
const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 11, 0)).toISOString();

const seedVendors: Vendor[] = [
  { id: "ven-1", name: "DentMart Supplies", category: "Consumables", contact: "Rakesh Iyer", email: "sales@dentmart.in", phone: "+91 98860 11200", city: "Bengaluru", gstin: "29AADEM1234C1Z2", pan: "AADEM1234C", rating: 5, active: true, msme: true, udyam: "UDYAM-KR-03-0012845", bank: { accountName: "DentMart Supplies Pvt Ltd", accountNumber: "501000234511", ifsc: "HDFC0000123", bankName: "HDFC Bank", branch: "Indiranagar" }, token: "dentmart-9f3a21" },
  { id: "ven-2", name: "OrthoTech Equipments", category: "Equipment", contact: "Sneha Pillai", email: "orders@orthotech.in", phone: "+91 99000 22112", city: "Mumbai", gstin: "27AAFCO5678D1Z9", pan: "AAFCO5678D", rating: 4, active: true, tds: { section: "194Q", rate: 0.1 }, token: "orthotech-7b1c04" },
  { id: "ven-3", name: "Apex Dental Lab", category: "Lab Services", contact: "Dr. Mohan", email: "lab@apexdental.in", phone: "+91 98450 33445", city: "Bengaluru", gstin: "29AAGCA9012E1Z4", pan: "AAGCA9012E", rating: 4, active: true, msme: true, udyam: "UDYAM-KR-03-0009921", bank: { accountName: "Apex Dental Laboratory", accountNumber: "0911201005678", ifsc: "ICIC0000911", bankName: "ICICI Bank", branch: "Richmond Road" }, tds: { section: "194C", rate: 2 }, token: "apexlab-3d8e55" },
  { id: "ven-4", name: "MediPharm Distributors", category: "Pharmacy", contact: "Asha Verma", email: "supply@medipharm.in", phone: "+91 97400 55667", city: "Hyderabad", gstin: "36AALPM3456F1Z1", rating: 4, active: true, token: "medipharm-6a2f90" },
  { id: "ven-5", name: "PrecisionInstru Co.", category: "Instruments", contact: "Karan Shah", email: "hello@precisioninstru.in", phone: "+91 99300 77889", city: "Ahmedabad", gstin: "24AAHCP7890G1Z7", rating: 3, active: true, token: "precision-1e4b77" },
  { id: "ven-6", name: "SmileSource Traders", category: "Consumables", contact: "Nisha Reddy", email: "info@smilesource.in", phone: "+91 96320 99001", city: "Bengaluru", gstin: "29AAJCS2345H1Z3", rating: 4, active: true, token: "smilesource-8c5d12" },
];

const seedRfqs: Rfq[] = [
  {
    id: "RFQ-1042",
    title: "Restorative consumables — June restock",
    category: "Consumables",
    createdAt: daysAgo(3),
    status: "quoted",
    channel: "both",
    items: [
      { name: "Composite resin kit (A2)", qty: 10, unit: "kits" },
      { name: "Bonding agent (5ml)", qty: 8, unit: "bottles" },
      { name: "Disposable gloves (M)", qty: 20, unit: "boxes" },
    ],
    vendorIds: ["ven-1", "ven-6"],
    notes: "Need delivery to Indiranagar branch within a week.",
    quotes: [
      {
        id: "q-1", vendorId: "ven-1", submittedAt: daysAgo(2), leadTimeDays: 4, validityDays: 15,
        notes: "GST extra. Free shipping above ₹10,000.",
        lines: [
          { itemName: "Composite resin kit (A2)", qty: 10, unitPrice: 32 },
          { itemName: "Bonding agent (5ml)", qty: 8, unitPrice: 14 },
          { itemName: "Disposable gloves (M)", qty: 20, unitPrice: 4.2 },
        ],
        total: 10 * 32 + 8 * 14 + 20 * 4.2,
      },
      {
        id: "q-2", vendorId: "ven-6", submittedAt: daysAgo(1), leadTimeDays: 6, validityDays: 10,
        lines: [
          { itemName: "Composite resin kit (A2)", qty: 10, unitPrice: 29.5 },
          { itemName: "Bonding agent (5ml)", qty: 8, unitPrice: 15 },
          { itemName: "Disposable gloves (M)", qty: 20, unitPrice: 3.9 },
        ],
        total: 10 * 29.5 + 8 * 15 + 20 * 3.9,
      },
    ],
  },
  {
    id: "RFQ-1043",
    title: "Autoclave Class B — Whitefield branch",
    category: "Equipment",
    createdAt: daysAgo(1),
    status: "sent",
    channel: "email",
    items: [{ name: "Class B autoclave 23L", qty: 1, unit: "unit" }],
    vendorIds: ["ven-2", "ven-5"],
    quotes: [],
  },
];

// Seeded vendor bills (direct purchases, received in full + invoiced) so the
// GST inward-supply / ITC reports have history. Mix of intra-state (Karnataka
// vendors → CGST+SGST) and inter-state (→ IGST), across both financial years.
const round2s = (n: number) => Math.round(n * 100) / 100;
const mkPO = (
  id: string,
  vendorId: string,
  date: string,
  title: string,
  items: { itemName: string; qty: number; unitPrice: number }[],
  invoiceNumber: string,
  paid: boolean,
  payMode: POPayMode = "bank"
): PurchaseOrder => {
  const total = round2s(items.reduce((s, l) => s + l.qty * l.unitPrice, 0));
  const received: Record<string, number> = {};
  items.forEach((l) => (received[l.itemName] = l.qty));
  return {
    id,
    rfqTitle: title,
    vendorId,
    date,
    items,
    total,
    manual: true,
    status: paid ? "paid" : "invoiced",
    receipts: [{ id: `grn-seed-${id}`, date, note: "Received in full", lines: items.map((l) => ({ itemName: l.itemName, qty: l.qty })) }],
    received,
    invoice: { number: invoiceNumber, date, amount: total },
    payment: paid ? { date, mode: payMode, reference: `TXN-${id}`, amount: total } : undefined,
  };
};

const seedPOs: PurchaseOrder[] = [
  mkPO("PO-1001", "ven-1", day(2025, 7, 10), "Restorative consumables restock", [
    { itemName: "Composite resin kit (A2)", qty: 10, unitPrice: 32 },
    { itemName: "Disposable gloves (M)", qty: 20, unitPrice: 4.2 },
  ], "DM/25-26/0192", true, "upi"),
  mkPO("PO-1002", "ven-2", day(2025, 9, 5), "Class B autoclave — Whitefield", [
    { itemName: "Class B autoclave 23L", qty: 1, unitPrice: 950 },
  ], "OT-2025-441", true, "bank"),
  mkPO("PO-1003", "ven-3", day(2025, 12, 2), "Zirconia crown units — lab", [
    { itemName: "Zirconia crown unit", qty: 6, unitPrice: 45 },
  ], "APEX/1182", true, "bank"),
  mkPO("PO-1004", "ven-4", day(2026, 2, 14), "Pharmacy restock", [
    { itemName: "Amoxicillin 500mg strip", qty: 40, unitPrice: 1.5 },
    { itemName: "Lignocaine 2% vial", qty: 20, unitPrice: 2 },
  ], "MP-7741", true, "bank"),
  mkPO("PO-1005", "ven-5", day(2026, 4, 18), "Extraction instruments", [
    { itemName: "Extraction forceps set", qty: 3, unitPrice: 28 },
    { itemName: "Scaler tips", qty: 10, unitPrice: 6 },
  ], "PI/26-27/058", false),
  mkPO("PO-1006", "ven-1", daysAgo(8), "Bonding & gloves — June restock", [
    { itemName: "Bonding agent (5ml)", qty: 8, unitPrice: 14 },
    { itemName: "Disposable gloves (M)", qty: 30, unitPrice: 4 },
  ], "DM/26-27/0061", false),
  mkPO("PO-1007", "ven-6", daysAgo(20), "Impression material", [
    { itemName: "Impression material kit", qty: 12, unitPrice: 9 },
  ], "SS-3390", true, "upi"),
];

// Self-registration invite — a prospective vendor opens the link and fills in
// their own details (GSTIN auto-fill, bank, MSME) to register.
export interface VendorInvite {
  token: string;
  email?: string;
  phone?: string;
  note?: string;
  createdAt: string;
  status: "pending" | "registered";
  vendorId?: string;
}

interface VendorDb {
  vendors: Vendor[];
  rfqs: Rfq[];
  pos: PurchaseOrder[];
  invites: VendorInvite[];
  seq: number;
}
const g = globalThis as unknown as { __vendors?: VendorDb };
if (!g.__vendors) {
  g.__vendors = {
    vendors: seedVendors.map((v) => ({ ...v })),
    rfqs: seedRfqs.map((r) => ({ ...r })),
    pos: seedPOs.map((p) => ({ ...p })),
    invites: [],
    seq: 1044,
  };
}
const db = g.__vendors;
if (!db.invites) db.invites = []; // defensive for hot-reloaded older state

// ---- vendors ----
export function listVendors() {
  return db.vendors;
}
export function getVendor(id: string) {
  return db.vendors.find((v) => v.id === id) ?? null;
}
export function getVendorByToken(token: string) {
  return db.vendors.find((v) => v.token === token) ?? null;
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) || "vendor";
}
export function addVendor(input: Partial<Vendor>): Vendor {
  const name = input.name?.trim() || "New Vendor";
  const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  // derive primary GSTIN/PAN/city from the registrations list, if provided
  const regs = input.registrations?.filter((r) => r.gstin?.trim()) ?? [];
  const primary = regs.find((r) => r.primary) ?? regs[0];
  const next: Vendor = {
    id: `ven-${Date.now()}`,
    name,
    category: (input.category as VendorCategory) || "Consumables",
    contact: input.contact?.trim() || "",
    email: input.email?.trim() || "",
    phone: input.phone?.trim() || "",
    city: input.city?.trim() || primary?.city || "",
    gstin: input.gstin?.trim() || primary?.gstin || "",
    pan: input.pan?.trim() || primary?.pan || undefined,
    registrations: regs.length ? regs : undefined,
    rating: Math.min(5, Math.max(1, input.rating ?? 4)),
    active: input.active ?? true,
    msme: input.msme ?? false,
    udyam: input.udyam?.trim() || undefined,
    bank: input.bank,
    tds: input.tds && input.tds.section ? { section: input.tds.section, rate: input.tds.rate } : undefined,
    token: `${slugify(name)}-${rand}`,
  };
  db.vendors.unshift(next);
  return next;
}
export function updateVendor(id: string, patch: Partial<Vendor>) {
  const i = db.vendors.findIndex((v) => v.id === id);
  if (i < 0) return null;
  db.vendors[i] = { ...db.vendors[i], ...patch, id: db.vendors[i].id };
  return db.vendors[i];
}

// ---- vendor self-registration invites ----
export function listVendorInvites() {
  return [...db.invites].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function createVendorInvite(input: { email?: string; phone?: string; note?: string }): VendorInvite {
  const rand = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  const invite: VendorInvite = {
    token: `vreg-${rand}`,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    note: input.note?.trim() || undefined,
    createdAt: iso(),
    status: "pending",
  };
  db.invites.unshift(invite);
  return invite;
}
export function getVendorInvite(token: string) {
  return db.invites.find((i) => i.token === token) ?? null;
}
// A prospective vendor submits their details against an invite → creates the vendor.
export function completeVendorInvite(token: string, input: Partial<Vendor>): Vendor | null {
  const invite = getVendorInvite(token);
  if (!invite || invite.status === "registered") return null;
  const vendor = addVendor(input);
  invite.status = "registered";
  invite.vendorId = vendor.id;
  return vendor;
}

// ---- RFQs ----
export function listRfqs() {
  return [...db.rfqs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getRfq(id: string) {
  return db.rfqs.find((r) => r.id === id) ?? null;
}
export function createRfq(input: {
  title: string;
  category: VendorCategory;
  channel: Channel;
  items: RfqItem[];
  vendorIds: string[];
  notes?: string;
  send?: boolean;
}): Rfq {
  const id = `RFQ-${db.seq++}`;
  const items = input.items.filter((i) => i.name.trim() && i.qty > 0);
  const next: Rfq = {
    id,
    title: input.title.trim() || "Untitled request",
    category: input.category,
    createdAt: iso(),
    status: input.send && input.vendorIds.length ? "sent" : "draft",
    channel: input.channel,
    items,
    vendorIds: input.vendorIds,
    notes: input.notes?.trim() || undefined,
    quotes: [],
  };
  db.rfqs.unshift(next);
  return next;
}
export function sendRfq(id: string) {
  const r = getRfq(id);
  if (!r || !r.vendorIds.length) return null;
  if (r.status === "draft") r.status = "sent";
  return r;
}

// Deterministic-ish base price from an item name, so simulated quotes look stable.
function basePrice(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const big = /autoclave|chair|x-?ray|scanner|machine|unit|equipment|compressor/i.test(name);
  const span = big ? 1200 : 40;
  const floor = big ? 300 : 3;
  return Math.round((floor + (h % 1000) / 1000 * span) * 100) / 100;
}

// Simulate invited vendors replying with quotes (the demo stand-in for real
// email/SMS round-trips). Each invited vendor that hasn't quoted yet submits one.
export function simulateQuotes(id: string) {
  const r = getRfq(id);
  if (!r) return null;
  r.vendorIds.forEach((vid, vi) => {
    if (r.quotes.some((q) => q.vendorId === vid)) return;
    const vendor = getVendor(vid);
    // vendor-specific price factor: 0.88–1.12 derived from id, lower rating = pricier
    let vh = 0;
    for (let i = 0; i < vid.length; i++) vh = (vh * 17 + vid.charCodeAt(i)) >>> 0;
    const factor = 0.88 + (vh % 25) / 100; // 0.88..1.12
    const ratingAdj = vendor ? (5 - vendor.rating) * 0.015 : 0;
    const lines: QuoteLine[] = r.items.map((it) => ({
      itemName: it.name,
      qty: it.qty,
      unitPrice: Math.round(basePrice(it.name) * (factor + ratingAdj) * 100) / 100,
    }));
    const total = Math.round(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0) * 100) / 100;
    r.quotes.push({
      id: `q-${Date.now()}-${vi}`,
      vendorId: vid,
      submittedAt: iso(),
      lines,
      total,
      leadTimeDays: 3 + (vh % 12),
      validityDays: 10 + (vh % 3) * 5,
    });
  });
  if (r.quotes.length) r.status = "quoted";
  return r;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function awardRfq(id: string, vendorId: string): PurchaseOrder | null {
  const r = getRfq(id);
  if (!r) return null;
  const quote = r.quotes.find((q) => q.vendorId === vendorId);
  if (!quote) return null;
  const po: PurchaseOrder = {
    id: `PO-${db.seq++}`,
    rfqId: r.id,
    rfqTitle: r.title,
    vendorId,
    date: iso(),
    items: quote.lines,
    total: quote.total,
    status: "issued",
    receipts: [],
    received: {},
  };
  db.pos.unshift(po);
  r.status = "awarded";
  r.awardedVendorId = vendorId;
  r.poId = po.id;
  r.awards = [{ vendorId, poId: po.id }];
  return po;
}

// Split / partial award: assign each line item to a vendor (from those who
// quoted). Generates one PO per distinct awarded vendor.
export function awardRfqSplit(
  id: string,
  assignments: { itemName: string; vendorId: string }[]
): PurchaseOrder[] | null {
  const r = getRfq(id);
  if (!r || r.status === "awarded") return null;
  const byVendor = new Map<string, QuoteLine[]>();
  for (const a of assignments) {
    const item = r.items.find((it) => it.name === a.itemName);
    const quote = r.quotes.find((q) => q.vendorId === a.vendorId);
    const qline = quote?.lines.find((l) => l.itemName === a.itemName);
    if (!item || !qline) continue;
    const line: QuoteLine = { itemName: item.name, qty: item.qty, unitPrice: qline.unitPrice };
    if (!byVendor.has(a.vendorId)) byVendor.set(a.vendorId, []);
    byVendor.get(a.vendorId)!.push(line);
  }
  if (byVendor.size === 0) return null;
  const split = byVendor.size > 1;
  const created: PurchaseOrder[] = [];
  const awards: { vendorId: string; poId: string }[] = [];
  for (const [vendorId, lines] of Array.from(byVendor.entries())) {
    const total = round2(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
    const po: PurchaseOrder = {
      id: `PO-${db.seq++}`,
      rfqId: r.id,
      rfqTitle: split ? `${r.title} — ${getVendor(vendorId)?.name ?? vendorId}` : r.title,
      vendorId,
      date: iso(),
      items: lines,
      total,
      status: "issued",
      receipts: [],
      received: {},
    };
    db.pos.unshift(po);
    created.push(po);
    awards.push({ vendorId, poId: po.id });
  }
  r.status = "awarded";
  r.awards = awards;
  r.awardedVendorId = awards[0].vendorId;
  r.poId = awards[0].poId;
  return created;
}

// Allocation award: split each line's quantity across one or more vendors, each
// at a (possibly renegotiated) unit price. One PO per distinct vendor.
export function awardRfqAllocations(
  id: string,
  allocations: { itemName: string; vendorId: string; qty: number; unitPrice: number }[]
): PurchaseOrder[] | null {
  const r = getRfq(id);
  if (!r || r.status === "awarded") return null;
  const byVendor = new Map<string, QuoteLine[]>();
  for (const a of allocations) {
    if (!a.vendorId || !(a.qty > 0)) continue;
    const item = r.items.find((it) => it.name === a.itemName);
    if (!item) continue;
    // merge same item+vendor allocations into one line
    const lines = byVendor.get(a.vendorId) ?? [];
    const existing = lines.find((l) => l.itemName === a.itemName);
    const unitPrice = round2(a.unitPrice >= 0 ? a.unitPrice : 0);
    if (existing) {
      existing.qty = round2(existing.qty + a.qty);
    } else {
      lines.push({ itemName: item.name, qty: round2(a.qty), unitPrice });
    }
    byVendor.set(a.vendorId, lines);
  }
  if (byVendor.size === 0) return null;
  const split = byVendor.size > 1;
  const created: PurchaseOrder[] = [];
  const awards: { vendorId: string; poId: string }[] = [];
  for (const [vendorId, lines] of Array.from(byVendor.entries())) {
    const total = round2(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
    const po: PurchaseOrder = {
      id: `PO-${db.seq++}`,
      rfqId: r.id,
      rfqTitle: split ? `${r.title} — ${getVendor(vendorId)?.name ?? vendorId}` : r.title,
      vendorId,
      date: iso(),
      items: lines,
      total,
      status: "issued",
      receipts: [],
      received: {},
    };
    db.pos.unshift(po);
    created.push(po);
    awards.push({ vendorId, poId: po.id });
  }
  r.status = "awarded";
  r.awards = awards;
  r.awardedVendorId = awards[0].vendorId;
  r.poId = awards[0].poId;
  return created;
}

// Record a purchase directly, with no RFQ/quote/PO-approval round-trip. Useful
// for small or urgent buys. May carry an invoice and/or payment immediately.
export function addManualPurchase(input: {
  vendorId: string;
  title: string;
  items: { name: string; qty: number; unitPrice: number }[];
  invoiceNumber?: string;
  invoiceDate?: string;
  pay?: boolean;
  payMode?: POPayMode;
  payReference?: string;
}): PurchaseOrder | null {
  if (!getVendor(input.vendorId)) return null;
  const lines: QuoteLine[] = input.items
    .filter((i) => i.name.trim() && i.qty > 0)
    .map((i) => ({ itemName: i.name.trim(), qty: i.qty, unitPrice: i.unitPrice }));
  if (!lines.length) return null;
  const total = round2(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
  const received: Record<string, number> = {};
  lines.forEach((l) => (received[l.itemName] = l.qty)); // direct buys are received in full
  const hasInvoice = !!input.invoiceNumber?.trim();
  const po: PurchaseOrder = {
    id: `PO-${db.seq++}`,
    rfqTitle: input.title.trim() || "Direct purchase",
    vendorId: input.vendorId,
    date: iso(),
    items: lines,
    total,
    manual: true,
    receipts: [{ id: `grn-${Date.now()}`, date: iso(), note: "Direct purchase — received in full", lines: lines.map((l) => ({ itemName: l.itemName, qty: l.qty })) }],
    received,
    status: "received",
  };
  if (hasInvoice) {
    po.invoice = { number: input.invoiceNumber!.trim(), date: input.invoiceDate || iso(), amount: total };
    po.status = "invoiced";
  }
  if (input.pay && hasInvoice) {
    po.payment = { date: iso(), mode: input.payMode ?? "bank", reference: input.payReference?.trim() || undefined, amount: total };
    po.status = "paid";
  }
  db.pos.unshift(po);
  // a direct purchase is received in full → reflect into inventory
  lines.forEach((l) => receiveIntoInventory(l.itemName, l.qty, `Direct · ${po.id}`));
  return po;
}

export function getPurchaseOrder(id: string) {
  return db.pos.find((p) => p.id === id) ?? null;
}

function recomputeReceipt(po: PurchaseOrder) {
  const fully = po.items.every((it) => (po.received[it.itemName] ?? 0) >= it.qty);
  const any = po.items.some((it) => (po.received[it.itemName] ?? 0) > 0);
  po.status = fully ? "received" : any ? "partial" : "issued";
}

// Goods receipt — received qty per line may be less or more than ordered.
export function receivePO(
  id: string,
  input: { lines: { itemName: string; qty: number; free?: number }[]; note?: string; date?: string }
) {
  const po = getPurchaseOrder(id);
  if (!po) return null;
  if (po.status === "closed" || po.status === "paid" || po.status === "invoiced") return null;
  const lines = input.lines
    .map((l) => ({ itemName: l.itemName, qty: l.qty, free: Math.max(0, l.free ?? 0) }))
    .filter((l) => l.qty !== 0 || l.free !== 0);
  if (!lines.length) return po;
  po.receipts.push({ id: `grn-${Date.now()}`, date: input.date || iso(), note: input.note?.trim() || undefined, lines });
  lines.forEach((l) => {
    // only billable qty counts toward the ordered balance (so PO value stays matched)
    po.received[l.itemName] = round2((po.received[l.itemName] ?? 0) + l.qty);
    // both billable and free units flow into inventory
    const totalIn = l.qty + l.free;
    if (totalIn > 0) {
      receiveIntoInventory(l.itemName, totalIn, `GRN · ${po.id}${l.free ? ` · ${l.free} free` : ""}`);
    }
  });
  recomputeReceipt(po);
  return po;
}

export function closePO(id: string, reason?: string) {
  const po = getPurchaseOrder(id);
  if (!po || po.status === "paid") return null;
  po.status = "closed";
  po.closedReason = reason?.trim() || undefined;
  return po;
}

export function invoicePO(id: string, input: { number: string; date?: string; amount: number }) {
  const po = getPurchaseOrder(id);
  if (!po || po.status === "closed" || po.status === "paid") return null;
  po.invoice = { number: input.number.trim() || po.id, date: input.date || iso(), amount: round2(input.amount) };
  po.status = "invoiced";
  return po;
}

export function payPO(
  id: string,
  input: { amount: number; mode: POPayMode; reference?: string; date?: string }
) {
  const po = getPurchaseOrder(id);
  if (!po || !po.invoice) return null;
  po.payment = { date: input.date || iso(), mode: input.mode, reference: input.reference?.trim() || undefined, amount: round2(input.amount) };
  po.status = "paid";
  return po;
}

export function listPurchaseOrders() {
  return [...db.pos].sort((a, b) => b.date.localeCompare(a.date));
}

// ---- vendor self-service portal (per-vendor unique link) ----
export function vendorPortalData(token: string) {
  const vendor = getVendorByToken(token);
  if (!vendor) return null;
  const rfqs = db.rfqs
    .filter((r) => r.vendorIds.includes(vendor.id))
    .map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      createdAt: r.createdAt,
      status: r.status,
      items: r.items,
      notes: r.notes,
      myQuote: r.quotes.find((q) => q.vendorId === vendor.id) ?? null,
      awardedToMe: r.awardedVendorId === vendor.id,
      poId: r.awardedVendorId === vendor.id ? r.poId : undefined,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pos = db.pos
    .filter((p) => p.vendorId === vendor.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  return { vendor, rfqs, pos };
}

// Vendor submits a bid against an RFQ they were invited to, via their portal link.
export function submitQuoteByToken(
  token: string,
  rfqId: string,
  input: { lines: { itemName: string; unitPrice: number }[]; leadTimeDays: number; validityDays: number; notes?: string }
) {
  const vendor = getVendorByToken(token);
  if (!vendor) return null;
  const r = getRfq(rfqId);
  if (!r || !r.vendorIds.includes(vendor.id)) return null;
  if (r.status === "awarded") return null;
  // a vendor may revise: drop any prior quote of theirs first
  r.quotes = r.quotes.filter((q) => q.vendorId !== vendor.id);
  const lines: QuoteLine[] = r.items.map((it) => {
    const match = input.lines.find((l) => l.itemName === it.name);
    return { itemName: it.name, qty: it.qty, unitPrice: round2(match?.unitPrice ?? 0) };
  });
  const total = round2(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
  r.quotes.push({
    id: `q-${Date.now()}`,
    vendorId: vendor.id,
    submittedAt: iso(),
    lines,
    total,
    leadTimeDays: Math.max(1, Math.round(input.leadTimeDays || 7)),
    validityDays: Math.max(1, Math.round(input.validityDays || 15)),
    notes: input.notes?.trim() || undefined,
  });
  r.status = "quoted";
  return r;
}

export function procurementMetrics() {
  const open = db.rfqs.filter((r) => r.status === "sent" || r.status === "quoted").length;
  const awaitingQuotes = db.rfqs.filter((r) => r.status === "sent").length;
  const poValue = round2(db.pos.reduce((s, p) => s + p.total, 0));
  // payables = invoiced-but-unpaid bills
  const payablesDue = round2(
    db.pos
      .filter((p) => p.status === "invoiced")
      .reduce((s, p) => s + (p.invoice?.amount ?? p.total), 0)
  );
  return {
    vendors: db.vendors.filter((v) => v.active).length,
    openRequests: open,
    awaitingQuotes,
    purchaseOrders: db.pos.length,
    poValue,
    payablesDue,
  };
}
