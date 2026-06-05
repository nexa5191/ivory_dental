// In-memory GST/TDS compliance ledger — the reconciliation & audit-trail layer
// that sits on top of the billing/purchase data. Tracks, per document:
//   • whether an outward invoice has been reported in GSTR-1 ("filed")
//   • whether ITC on a purchase bill has been claimed in GSTR-3B
//   • TDS payable knocked off via a deposit challan (CIN)
//   • TDS receivable knocked off via a TDS certificate (Form 16A)
// Every change appends to a per-document audit trail. Mock — resets on restart.

export interface TrailEvent {
  ts: string;
  event: string;
  ref?: string;
}

export interface ComplianceRec {
  gstr1Filed?: boolean;
  gstr1Ref?: string; // GSTR-1 ARN / return ref
  gstr1Period?: string; // return period it was reported in (YYYY-MM)
  gstr1Held?: boolean; // deliberately excluded from GSTR-1 (on hold)
  itcClaimed?: boolean;
  itcRef?: string; // GSTR-3B ref
  itcPeriod?: string; // GSTR-3B return period ITC claimed in (YYYY-MM)
  itcHeld?: boolean; // deliberately not claimed (ineligible / on hold)
  tdsDeposited?: boolean;
  challanNo?: string; // CIN of the TDS deposit challan
  tdsCertified?: boolean;
  certNo?: string; // Form 16A certificate number
  trail: TrailEvent[];
}

export type ComplianceAction =
  | "fileGstr1"
  | "unfileGstr1"
  | "holdGstr1"
  | "unholdGstr1"
  | "claimItc"
  | "unclaimItc"
  | "holdItc"
  | "unholdItc"
  | "depositTds"
  | "undepositTds"
  | "certifyTds"
  | "uncertifyTds";

const monthLbl = (p?: string) => {
  if (!p) return "";
  const [y, m] = p.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[parseInt(m, 10) - 1]} ${y}`;
};

const T = new Date("2026-06-04T00:00:00Z").getTime();
const iso = (daysAgo = 0) => new Date(T - daysAgo * 86400000).toISOString();
const ev = (event: string, ref?: string, daysAgo = 0): TrailEvent => ({ ts: iso(daysAgo), event, ref });

type Db = Record<string, ComplianceRec>;

const g = globalThis as unknown as { __compliance?: Db };
if (!g.__compliance) {
  const db: Db = {};
  // Seed: most historical (pre-June) documents are already filed/claimed, so the
  // current period has a realistic backlog of "pending" items to reconcile.
  const filedInvoices = ["INV-2001", "INV-2002", "INV-2003", "INV-2004", "INV-2005", "INV-2006", "INV-2007", "INV-2008", "INV-2009", "INV-2010", "INV-2011", "INV-2012", "INV-2013", "INV-2014", "INV-2015", "INV-2016"];
  filedInvoices.forEach((id, i) => {
    db[id] = { gstr1Filed: true, gstr1Ref: `AA29${(2300 + i).toString().padStart(8, "0")}`, trail: [ev("Reported in GSTR-1", `AA29${(2300 + i)}`, 20)] };
  });
  // older purchase bills: ITC claimed in their respective 3B period; June bills pending
  const claimedBills: [string, string][] = [["PO-1001", "2025-07"], ["PO-1002", "2025-09"], ["PO-1003", "2025-12"], ["PO-1004", "2026-02"]];
  claimedBills.forEach(([id, period]) => {
    db[id] = { itcClaimed: true, itcRef: `3B-${period}`, itcPeriod: period, trail: [ev(`ITC claimed in GSTR-3B for ${period}`, `3B-${period}`, 18)] };
  });
  // TDS payable already deposited for the lab bill (194C)
  db["tdsp:PO-1003"] = { tdsDeposited: true, challanNo: "CIN0291225000456", trail: [ev("TDS deposited — challan", "CIN0291225000456", 15)] };
  g.__compliance = db;
}
const db = g.__compliance;

// ── period-level GSTR-1 filing & lock (parallel to the 3B file-&-lock) ──
const gpf = globalThis as unknown as { __gstr1Filings?: Record<string, { period: string; date: string }> };
if (!gpf.__gstr1Filings) {
  // seed-lock a couple of older, fully-reported periods
  gpf.__gstr1Filings = {
    "2025-12": { period: "2025-12", date: iso(20) },
    "2026-02": { period: "2026-02", date: iso(20) },
  };
}
const gstr1Filings = gpf.__gstr1Filings;

export function listGstr1Filings(): Record<string, { period: string; date: string }> {
  return gstr1Filings;
}
export function fileGstr1Period(period: string) {
  const p = period?.trim();
  if (!p) return { ok: false as const, error: "Pick a return period." };
  if (gstr1Filings[p]) return { ok: false as const, error: `GSTR-1 for ${p} is already filed & locked.` };
  gstr1Filings[p] = { period: p, date: iso() };
  return { ok: true as const };
}
export function unfileGstr1Period(period: string) {
  const p = period?.trim();
  if (!p || !gstr1Filings[p]) return { ok: false as const, error: "Not filed." };
  delete gstr1Filings[p];
  return { ok: true as const };
}

export function getCompliance(id: string): ComplianceRec {
  return db[id] ?? { trail: [] };
}

export function snapshotCompliance(): Db {
  return db;
}

export function updateCompliance(id: string, action: ComplianceAction, ref?: string, period?: string): ComplianceRec {
  const rec = db[id] ?? (db[id] = { trail: [] });
  const r = ref?.trim() || undefined;
  const p = period?.trim() || undefined;
  const inP = p ? ` for ${monthLbl(p)}` : "";
  switch (action) {
    case "fileGstr1":
      rec.gstr1Filed = true;
      rec.gstr1Ref = r;
      rec.gstr1Period = p;
      rec.gstr1Held = false;
      rec.trail.push(ev(`Reported in GSTR-1${inP}`, r));
      break;
    case "unfileGstr1":
      rec.gstr1Filed = false;
      rec.gstr1Ref = undefined;
      rec.gstr1Period = undefined;
      rec.trail.push(ev("Removed from GSTR-1"));
      break;
    case "holdGstr1":
      rec.gstr1Held = true;
      rec.trail.push(ev("Held — excluded from GSTR-1"));
      break;
    case "unholdGstr1":
      rec.gstr1Held = false;
      rec.trail.push(ev("Hold released — eligible for GSTR-1"));
      break;
    case "claimItc":
      rec.itcClaimed = true;
      rec.itcRef = r;
      rec.itcPeriod = p;
      rec.itcHeld = false;
      rec.trail.push(ev(`ITC claimed in GSTR-3B${inP}`, r));
      break;
    case "unclaimItc":
      rec.itcClaimed = false;
      rec.itcRef = undefined;
      rec.itcPeriod = undefined;
      rec.trail.push(ev("ITC reversed / un-claimed"));
      break;
    case "holdItc":
      rec.itcHeld = true;
      rec.trail.push(ev("Held — ITC not to be claimed"));
      break;
    case "unholdItc":
      rec.itcHeld = false;
      rec.trail.push(ev("Hold released — ITC eligible"));
      break;
    case "depositTds":
      rec.tdsDeposited = true;
      rec.challanNo = r;
      rec.trail.push(ev("TDS deposited — challan", r));
      break;
    case "undepositTds":
      rec.tdsDeposited = false;
      rec.challanNo = undefined;
      rec.trail.push(ev("TDS deposit reversed"));
      break;
    case "certifyTds":
      rec.tdsCertified = true;
      rec.certNo = r;
      rec.trail.push(ev("TDS certificate (16A) received", r));
      break;
    case "uncertifyTds":
      rec.tdsCertified = false;
      rec.certNo = undefined;
      rec.trail.push(ev("TDS certificate removed"));
      break;
  }
  return rec;
}
