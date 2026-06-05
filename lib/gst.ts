// GST engine for the Ivory Dental Suite (India). Pure, domain-free helpers:
// HSN/SAC classification, intra/inter-state CGST/SGST/IGST split, return-period
// (financial year / tax month) math, and state-code lookups.
//
// MONEY: like the rest of the app, every amount here is USD-base; the <Money>
// component converts to the active currency (default ₹) at display time.
//
// TAX MODEL: stored line amounts are treated as GST-INCLUSIVE gross, so adding
// GST never changes an invoice/PO total or a patient's outstanding balance — we
// only back-compute the embedded tax. Dental treatment is exempt healthcare
// (0%); cosmetic work is 18%; crown/implant lab material is 5%; goods follow
// their HSN slab. (Refs: Notf. 12/2017-CT entry 74; taxhandout.com/gst-on-dentists.)

export type TaxKind = "SAC" | "HSN";

export interface GstClass {
  code: string; // HSN or SAC code
  kind: TaxKind;
  rate: number; // % (0 = exempt / nil-rated)
  desc: string; // human label for the code
}

export interface GstSplit {
  taxable: number; // value before tax (USD)
  cgst: number;
  sgst: number;
  igst: number;
  tax: number; // cgst + sgst + igst
  gross: number; // taxable + tax (== the stored line amount)
  rate: number;
  interState: boolean;
}

// The clinic is registered in Karnataka. Any supplier/recipient outside 29 is an
// inter-state party (IGST); within 29 it is intra-state (CGST + SGST).
export const HOME_STATE_CODE = "29";

export const STATE_NAMES: Record<string, string> = {
  "24": "Gujarat",
  "27": "Maharashtra",
  "29": "Karnataka",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "06": "Haryana",
  "07": "Delhi",
  "09": "Uttar Pradesh",
  "19": "West Bengal",
  "32": "Kerala",
};

export function stateCodeFromGstin(gstin?: string): string {
  const code = (gstin ?? "").trim().slice(0, 2);
  return /^\d{2}$/.test(code) ? code : HOME_STATE_CODE;
}

export function stateName(code: string): string {
  return STATE_NAMES[code] ?? `State ${code}`;
}

export function isInterState(partyStateCode: string): boolean {
  return partyStateCode !== HOME_STATE_CODE;
}

// ---- HSN/SAC + rate catalogs (keyword-matched, first hit wins) ----

interface Rule {
  re: RegExp;
  cls: GstClass;
}

// Outward supplies — dental SERVICES (and prosthetic goods billed to patients).
const SERVICE_RULES: Rule[] = [
  { re: /whiten|bleach|veneer|smile\s*design|cosmetic|aesthetic/i, cls: { code: "999799", kind: "SAC", rate: 18, desc: "Cosmetic dental procedure" } },
  { re: /consult|review|check[\s-]?up|examination|opinion|follow[\s-]?up/i, cls: { code: "999312", kind: "SAC", rate: 0, desc: "Dental consultation (healthcare — exempt)" } },
  { re: /crown|implant|denture|bridge|prosth|pfm|zirconia|\bcap\b|abutment/i, cls: { code: "9021", kind: "HSN", rate: 5, desc: "Dental prosthetic — crown/implant (lab material)" } },
  { re: /x[\s-]?ray|radiograph|iopa|opg|imaging|\bscan\b/i, cls: { code: "999314", kind: "SAC", rate: 0, desc: "Diagnostic imaging (healthcare — exempt)" } },
];
const SERVICE_DEFAULT: GstClass = { code: "999312", kind: "SAC", rate: 0, desc: "Dental treatment (healthcare — exempt)" };

// Inward supplies — purchased GOODS (and lab services).
const GOODS_RULES: Rule[] = [
  { re: /crown|denture|implant|prosth|zirconia|pfm|bridge|abutment|\blab\b/i, cls: { code: "9021", kind: "HSN", rate: 5, desc: "Dental prosthetics / lab work" } },
  { re: /amoxicillin|lignocaine|lidocaine|medicine|medicament|tablet|capsule|strip|syrup|vial|antibiotic|pharma|\bdrug\b/i, cls: { code: "3004", kind: "HSN", rate: 12, desc: "Medicaments" } },
  { re: /forcep|scaler|probe|plier|elevator|instrument|\bbur\b|\btip\b|handpiece|mirror/i, cls: { code: "9018", kind: "HSN", rate: 12, desc: "Dental instruments" } },
  { re: /autoclave|sterili[sz]er|\bchair\b|x[\s-]?ray|scanner|compressor|machine|equipment|apex\s*locat/i, cls: { code: "9022", kind: "HSN", rate: 18, desc: "Dental equipment / apparatus" } },
  { re: /glove|mask|composite|resin|bonding|cement|cotton|impression|disposable|consumable|gauze|material|\bkit\b/i, cls: { code: "3006", kind: "HSN", rate: 18, desc: "Dental consumables" } },
];
const GOODS_DEFAULT: GstClass = { code: "9018", kind: "HSN", rate: 18, desc: "Dental goods (general)" };

export function classifyService(desc: string): GstClass {
  return SERVICE_RULES.find((r) => r.re.test(desc))?.cls ?? SERVICE_DEFAULT;
}

export function classifyGoods(name: string): GstClass {
  return GOODS_RULES.find((r) => r.re.test(name))?.cls ?? GOODS_DEFAULT;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Back-compute the embedded tax from a GST-inclusive gross amount.
export function splitInclusive(gross: number, rate: number, interState: boolean): GstSplit {
  const taxable = rate > 0 ? round2(gross / (1 + rate / 100)) : round2(gross);
  const tax = round2(gross - taxable);
  const cgst = interState ? 0 : round2(tax / 2);
  const sgst = interState ? 0 : round2(tax - cgst);
  const igst = interState ? tax : 0;
  return { taxable, cgst, sgst, igst, tax, gross: round2(gross), rate, interState };
}

// ---- return periods: Indian financial year (Apr–Mar) + tax month ----

// "2025-26" style FY label for an ISO date.
export function fyOf(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0-based; Apr = 3
  const start = m >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

// Inclusive [from, to] ISO-date (YYYY-MM-DD) range for an FY label like "2025-26".
export function fyRange(fy: string): { from: string; to: string } {
  const start = parseInt(fy.slice(0, 4), 10);
  return { from: `${start}-04-01`, to: `${start + 1}-03-31` };
}

// "2026-05" tax-month key for an ISO date.
export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[parseInt(m, 10) - 1]} ${y}`;
}

// A return period the user can pick. Encoded as the filter value:
//   "all" | "fy:2025-26" | "m:2026-05"
export type PeriodValue = string;

export function periodRange(value: PeriodValue): { from: string; to: string } {
  if (value.startsWith("fy:")) return fyRange(value.slice(3));
  if (value.startsWith("m:")) {
    const key = value.slice(2);
    const [y, m] = key.split("-").map((n) => parseInt(n, 10));
    const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); // last day of month
    return { from: `${key}-01`, to };
  }
  return { from: "", to: "" };
}

// ──────────────────────────────────────────────────────────────────────────
// GSTR-3B late filing — late fee + interest when filed after the due date
// (20th of the month following the tax period). Late fee ≈ ₹50/day (capped),
// interest 18% p.a. on the cash tax paid late. Amounts are USD-base.
// ──────────────────────────────────────────────────────────────────────────
export const GST_DEMO_TODAY = "2026-06-04"; // the app is pinned to this date
const LATE_FEE_PER_DAY = 0.6; // ≈ ₹50/day (₹25 CGST + ₹25 SGST)
const LATE_FEE_CAP = 60; // ≈ ₹5,000
const GST_INTEREST_RATE = 18; // % p.a.

function ymdToUTC(d: string): number {
  const [y, m, day] = d.split("-").map((n) => parseInt(n, 10));
  return Date.UTC(y, m - 1, day);
}

// Due date (YYYY-MM-DD) for a tax period "YYYY-MM": 20th of the next month.
export function gstr3bDueDate(period: string): string {
  const [y, m] = period.split("-").map((n) => parseInt(n, 10));
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-20`;
}

export interface LateCharges {
  daysLate: number;
  lateFeeCgst: number;
  lateFeeSgst: number;
  lateFee: number;
  interest: number;
  total: number;
  dueDate: string;
}

export function gstr3bLateCharges(period: string, cashTax: number, today: string = GST_DEMO_TODAY): LateCharges {
  const dueDate = gstr3bDueDate(period);
  const daysLate = Math.max(0, Math.round((ymdToUTC(today) - ymdToUTC(dueDate)) / 86400000));
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const lateFee = daysLate > 0 ? Math.min(daysLate * LATE_FEE_PER_DAY, LATE_FEE_CAP) : 0;
  const lateFeeCgst = r2(lateFee / 2);
  const lateFeeSgst = r2(lateFee - lateFeeCgst);
  const interest = daysLate > 0 ? r2(Math.max(0, cashTax) * (GST_INTEREST_RATE / 100) * (daysLate / 365)) : 0;
  return { daysLate, lateFeeCgst, lateFeeSgst, lateFee: r2(lateFee), interest, total: r2(lateFee + interest), dueDate };
}

// GST rate slabs offered in filters (0 == exempt / nil-rated).
export const GST_RATES = [0, 5, 12, 18, 28];

export function rateLabel(rate: number): string {
  return rate === 0 ? "Exempt / Nil" : `${rate}%`;
}

// ──────────────────────────────────────────────────────────────────────────
// TDS — Tax Deducted at Source on payments to vendors (Income-tax Act).
// Deducted on the taxable value (before GST) at payment/credit, deposited and
// reported quarterly in Form 26Q.
// ──────────────────────────────────────────────────────────────────────────
export interface TdsSection {
  code: string;
  label: string;
  rate: number; // default %
}

export const TDS_SECTIONS: TdsSection[] = [
  { code: "194C", label: "194C — Contractor / job work (e.g. dental lab)", rate: 2 },
  { code: "194J", label: "194J — Professional / technical services", rate: 10 },
  { code: "194Q", label: "194Q — Purchase of goods", rate: 0.1 },
  { code: "194I", label: "194I — Rent of plant / equipment", rate: 2 },
  { code: "194H", label: "194H — Commission / brokerage", rate: 5 },
];

export function tdsSectionRate(code: string): number {
  return TDS_SECTIONS.find((s) => s.code === code)?.rate ?? 0;
}

// TDS amount on a taxable base (GST is excluded from the TDS base).
export function tdsAmount(taxableBase: number, rate: number): number {
  return Math.round(taxableBase * (rate / 100) * 100) / 100;
}

// ──────────────────────────────────────────────────────────────────────────
// GSTR-3B set-off — offset output liability with input-tax credit per the
// statutory order (sec. 49 / Rule 88A), then the balance is paid in cash.
//   IGST credit → IGST, then CGST, then SGST
//   CGST credit → CGST, then IGST
//   SGST credit → SGST, then IGST
// (IGST credit is consumed first, so CGST/SGST credit only applies after it.)
// ──────────────────────────────────────────────────────────────────────────
export interface HeadAmounts { igst: number; cgst: number; sgst: number }

export interface SetOff {
  // credit utilised, indexed by credit head → liability head
  used: { igst: HeadAmounts; cgst: HeadAmounts; sgst: HeadAmounts };
  creditUsed: HeadAmounts; // total drawn from each credit head
  cashPayable: HeadAmounts; // liability remaining after credit
  creditLeft: HeadAmounts; // credit carried forward
}

export function computeSetOff(liability: HeadAmounts, credit: HeadAmounts): SetOff {
  const L: HeadAmounts = { igst: Math.max(0, liability.igst), cgst: Math.max(0, liability.cgst), sgst: Math.max(0, liability.sgst) };
  const C: HeadAmounts = { igst: Math.max(0, credit.igst), cgst: Math.max(0, credit.cgst), sgst: Math.max(0, credit.sgst) };
  const used = {
    igst: { igst: 0, cgst: 0, sgst: 0 } as HeadAmounts,
    cgst: { igst: 0, cgst: 0, sgst: 0 } as HeadAmounts,
    sgst: { igst: 0, cgst: 0, sgst: 0 } as HeadAmounts,
  };
  const apply = (ch: keyof typeof used, order: (keyof HeadAmounts)[]) => {
    for (const lh of order) {
      const amt = Math.min(C[ch], L[lh]);
      if (amt > 0) { C[ch] -= amt; L[lh] -= amt; used[ch][lh] += amt; }
    }
  };
  apply("igst", ["igst", "cgst", "sgst"]);
  apply("cgst", ["cgst", "igst"]);
  apply("sgst", ["sgst", "igst"]);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return {
    used,
    creditUsed: { igst: r2(used.igst.igst + used.igst.cgst + used.igst.sgst), cgst: r2(used.cgst.cgst + used.cgst.igst), sgst: r2(used.sgst.sgst + used.sgst.igst) },
    cashPayable: { igst: r2(L.igst), cgst: r2(L.cgst), sgst: r2(L.sgst) },
    creditLeft: { igst: r2(C.igst), cgst: r2(C.cgst), sgst: r2(C.sgst) },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// GSTIN parsing + a mock "GST portal" lookup (auto-fill)
//
// A real integration would call the GSTN/ASP API; here we derive everything we
// can from the GSTIN itself (state, PAN) and fabricate a deterministic, plausible
// legal name + registered address so the Auto-fill button has something to pull.
// ──────────────────────────────────────────────────────────────────────────

// 2-digit state + 10-char PAN + entity digit + 'Z' + checksum.
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

export function isValidGstin(gstin: string): boolean {
  return GSTIN_RE.test((gstin ?? "").trim().toUpperCase());
}

export function panFromGstin(gstin: string): string {
  return (gstin ?? "").trim().toUpperCase().slice(2, 12);
}

// state code → headquarter city + PIN prefix, for fabricated addresses.
const STATE_CITY: Record<string, { city: string; pin: string }> = {
  "24": { city: "Ahmedabad", pin: "380015" },
  "27": { city: "Mumbai", pin: "400069" },
  "29": { city: "Bengaluru", pin: "560038" },
  "33": { city: "Chennai", pin: "600040" },
  "36": { city: "Hyderabad", pin: "500081" },
  "06": { city: "Gurugram", pin: "122002" },
  "07": { city: "New Delhi", pin: "110024" },
  "09": { city: "Noida", pin: "201301" },
  "19": { city: "Kolkata", pin: "700019" },
  "32": { city: "Kochi", pin: "682016" },
};

// Official GST portal "Search Taxpayer" quicklink — for manual verification.
export const GST_PORTAL_SEARCH_URL = "https://services.gst.gov.in/services/quicklinks/searchtxp";

export interface GstRegistrant {
  gstin: string;
  pan: string;
  stateCode: string;
  stateName: string;
  legalName: string;
  tradeName: string;
  address: string;
  city: string;
  pincode: string;
  taxpayerType: string; // Regular / Composition / SEZ Unit / Input Service Distributor (ISD)
  taxpayerStatus: string; // Active / Cancelled
}

// Real registrant names for the GSTINs we seed, so a demo lookup of a known
// vendor returns the right party; anything else is fabricated deterministically.
const KNOWN_REGISTRANTS: Record<string, { legalName: string; tradeName: string; address: string }> = {
  "29AADEM1234C1Z2": { legalName: "DentMart Supplies Private Limited", tradeName: "DentMart Supplies", address: "No. 22, Industrial Layout, Indiranagar" },
  "27AAFCO5678D1Z9": { legalName: "OrthoTech Equipments LLP", tradeName: "OrthoTech Equipments", address: "Unit 7, MIDC Andheri East" },
  "29AAGCA9012E1Z4": { legalName: "Apex Dental Laboratory Private Limited", tradeName: "Apex Dental Lab", address: "12, Richmond Road" },
  "36AALPM3456F1Z1": { legalName: "MediPharm Distributors", tradeName: "MediPharm", address: "Plot 44, Jubilee Hills" },
  "24AAHCP7890G1Z7": { legalName: "PrecisionInstru Company Private Limited", tradeName: "PrecisionInstru Co.", address: "9, GIDC Estate, Vatva" },
  "29AAJCS2345H1Z3": { legalName: "SmileSource Traders Private Limited", tradeName: "SmileSource Traders", address: "48, Jayanagar 4th Block" },
};

const NAME_FIRST = ["Apex", "Nova", "Prime", "Crest", "Zenith", "Orbit", "Vertex", "Pioneer", "Summit", "Sterling", "Meridian", "Quantum"];
const NAME_SECOND = ["Dental", "Healthcare", "Medisys", "Surgicals", "Distributors", "Traders", "Enterprises", "Medequip", "Pharma", "Bioscience"];
const STREETS = ["Industrial Estate", "Commerce Park", "Trade Centre", "MG Road", "Ring Road", "Tech Park", "Market Yard"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// The mock "portal pull": resolve a GSTIN to registrant details, or null if the
// GSTIN is malformed.
export function gstLookup(gstinRaw: string): GstRegistrant | null {
  const gstin = (gstinRaw ?? "").trim().toUpperCase();
  if (!isValidGstin(gstin)) return null;
  const stateCode = gstin.slice(0, 2);
  const pan = panFromGstin(gstin);
  const loc = STATE_CITY[stateCode] ?? { city: stateName(stateCode), pin: "560001" };
  const known = KNOWN_REGISTRANTS[gstin];
  if (known) {
    return {
      gstin, pan, stateCode, stateName: stateName(stateCode),
      legalName: known.legalName, tradeName: known.tradeName,
      address: known.address, city: loc.city, pincode: loc.pin,
      taxpayerType: "Regular", taxpayerStatus: "Active",
    };
  }
  const h = hash(pan);
  const first = NAME_FIRST[h % NAME_FIRST.length];
  const second = NAME_SECOND[(h >> 4) % NAME_SECOND.length];
  const street = STREETS[(h >> 8) % STREETS.length];
  const trade = `${first} ${second}`;
  const types = ["Regular", "Regular", "Regular", "Regular", "Composition", "SEZ Unit", "Input Service Distributor (ISD)"];
  return {
    gstin, pan, stateCode, stateName: stateName(stateCode),
    legalName: `${trade} Private Limited`,
    tradeName: trade,
    address: `${(h % 200) + 1}, ${street}`,
    city: loc.city,
    pincode: loc.pin,
    taxpayerType: types[h % types.length],
    taxpayerStatus: h % 23 === 0 ? "Cancelled" : "Active",
  };
}
