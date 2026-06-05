// Electronic Credit Ledger (GST) — input-tax credit held under three heads:
// IGST, CGST, SGST. ITC accrues here; it is utilised to set off GSTR-3B output
// liability before any cash is paid. In-memory mock (USD base); resets on restart.

export type CreditHead = "igst" | "cgst" | "sgst";

export interface CreditEntry {
  id: string;
  date: string;
  kind: "accrual" | "utilisation";
  ref?: string; // return period
  period?: string;
  igst: number; // signed: accrual +, utilisation −
  cgst: number;
  sgst: number;
}

interface CreditDb {
  entries: CreditEntry[];
  seq: number;
}

const T = new Date("2026-06-04T00:00:00Z").getTime();
const iso = (daysAgo = 0) => new Date(T - daysAgo * 86400000).toISOString();
const round2 = (n: number) => Math.round(n * 100) / 100;

const g = globalThis as unknown as { __creditLedger?: CreditDb };
if (!g.__creditLedger) {
  const db: CreditDb = { entries: [], seq: 2 };
  // opening ITC carried forward
  db.entries.push({ id: "cr-1", date: iso(25), kind: "accrual", ref: "Opening balance", igst: 8, cgst: 6, sgst: 6 });
  g.__creditLedger = db;
}
const db = g.__creditLedger;

export function creditBalances() {
  const b = db.entries.reduce(
    (a, e) => ({ igst: a.igst + e.igst, cgst: a.cgst + e.cgst, sgst: a.sgst + e.sgst }),
    { igst: 0, cgst: 0, sgst: 0 }
  );
  return { igst: round2(b.igst), cgst: round2(b.cgst), sgst: round2(b.sgst) };
}

export function listCreditLedger() {
  const b = creditBalances();
  return {
    entries: [...db.entries].sort((a, z) => z.date.localeCompare(a.date)),
    balances: b,
    total: round2(b.igst + b.cgst + b.sgst),
  };
}

export function accrueCredit(input: { igst: number; cgst: number; sgst: number; ref?: string; period?: string }) {
  const igst = round2(Math.max(0, input.igst));
  const cgst = round2(Math.max(0, input.cgst));
  const sgst = round2(Math.max(0, input.sgst));
  if (igst + cgst + sgst <= 0) return;
  db.entries.push({ id: `cr-${db.seq++}`, date: iso(), kind: "accrual", ref: input.ref, period: input.period, igst, cgst, sgst });
}

// Draw credit down (signed negative entry) when set off against 3B liability.
export function utiliseCredit(input: { igst: number; cgst: number; sgst: number; period: string }) {
  const igst = round2(Math.max(0, input.igst));
  const cgst = round2(Math.max(0, input.cgst));
  const sgst = round2(Math.max(0, input.sgst));
  if (igst + cgst + sgst <= 0) return;
  db.entries.push({ id: `cr-${db.seq++}`, date: iso(), kind: "utilisation", ref: input.period, period: input.period, igst: -igst, cgst: -cgst, sgst: -sgst });
}

export function reverseCreditFor(period: string) {
  db.entries = db.entries.filter((e) => !(e.period === period));
}
