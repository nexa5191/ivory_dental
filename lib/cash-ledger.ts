// Electronic Cash Ledger (GST) — held under three minor heads: IGST, CGST, SGST.
// Money is deposited via challan and debited when a GSTR-3B is filed with payment.
// Filing a period locks it. In-memory mock (USD base); resets on restart.

export type CashHead = "igst" | "cgst" | "sgst";

export interface CashEntry {
  id: string;
  date: string;
  kind: "deposit" | "settlement";
  ref?: string; // challan CIN (deposit) or return period (settlement)
  period?: string; // settlement return period
  // signed amounts per head: deposits positive, settlements negative
  igst: number;
  cgst: number;
  sgst: number;
}

export interface FiledReturn {
  period: string;
  igst: number;
  cgst: number;
  sgst: number;
  date: string;
}

interface CashDb {
  entries: CashEntry[];
  filed: Record<string, FiledReturn>;
  seq: number;
}

const T = new Date("2026-06-04T00:00:00Z").getTime();
const iso = (daysAgo = 0) => new Date(T - daysAgo * 86400000).toISOString();
const round2 = (n: number) => Math.round(n * 100) / 100;

const g = globalThis as unknown as { __cashLedger?: CashDb };
if (!g.__cashLedger) {
  const db: CashDb = { entries: [], filed: {}, seq: 2 };
  // opening deposit so the ledger has a working balance per head
  db.entries.push({ id: "cl-1", date: iso(25), kind: "deposit", ref: "CIN0290526000111", igst: 20, cgst: 18, sgst: 18 });
  g.__cashLedger = db;
}
const db = g.__cashLedger;

function balances() {
  return db.entries.reduce(
    (b, e) => ({ igst: b.igst + e.igst, cgst: b.cgst + e.cgst, sgst: b.sgst + e.sgst }),
    { igst: 0, cgst: 0, sgst: 0 }
  );
}

export function cashBalances() {
  const b = balances();
  return { igst: round2(b.igst), cgst: round2(b.cgst), sgst: round2(b.sgst) };
}
export function isFiled3B(period: string) {
  return !!db.filed[period];
}

export function listCashLedger() {
  const b = balances();
  return {
    entries: [...db.entries].sort((a, z) => z.date.localeCompare(a.date)),
    balances: { igst: round2(b.igst), cgst: round2(b.cgst), sgst: round2(b.sgst) },
    total: round2(b.igst + b.cgst + b.sgst),
    filed: db.filed,
  };
}

export function addDeposit(input: { igst?: number; cgst?: number; sgst?: number; ref?: string; date?: string }) {
  const igst = round2(Math.max(0, input.igst ?? 0));
  const cgst = round2(Math.max(0, input.cgst ?? 0));
  const sgst = round2(Math.max(0, input.sgst ?? 0));
  if (igst + cgst + sgst <= 0) return { ok: false as const, error: "Enter a deposit amount." };
  const date = input.date ? new Date(`${input.date}T00:00:00Z`).toISOString() : iso();
  db.entries.push({ id: `cl-${db.seq++}`, date, kind: "deposit", ref: input.ref?.trim() || undefined, igst, cgst, sgst });
  return { ok: true as const };
}

// File GSTR-3B with payment: debit the net liability per head from the ledger.
// Fails if any head's balance is short. Locks the period once filed.
export function settle3B(input: { period: string; igst: number; cgst: number; sgst: number }) {
  const period = input.period?.trim();
  if (!period) return { ok: false as const, error: "Pick a return period." };
  if (db.filed[period]) return { ok: false as const, error: `GSTR-3B for ${period} is already filed & locked.` };
  const igst = round2(Math.max(0, input.igst));
  const cgst = round2(Math.max(0, input.cgst));
  const sgst = round2(Math.max(0, input.sgst));
  const b = balances();
  const short: string[] = [];
  if (igst > b.igst + 1e-6) short.push("IGST");
  if (cgst > b.cgst + 1e-6) short.push("CGST");
  if (sgst > b.sgst + 1e-6) short.push("SGST");
  if (short.length) return { ok: false as const, error: `Insufficient ${short.join(" / ")} balance — deposit more first.` };
  if (igst + cgst + sgst > 0) {
    db.entries.push({ id: `cl-${db.seq++}`, date: iso(), kind: "settlement", ref: period, period, igst: -igst, cgst: -cgst, sgst: -sgst });
  }
  db.filed[period] = { period, igst, cgst, sgst, date: iso() };
  return { ok: true as const };
}

export function reverse3B(period: string) {
  if (!db.filed[period]) return { ok: false as const, error: "Not filed." };
  delete db.filed[period];
  const idx = db.entries.findIndex((e) => e.kind === "settlement" && e.period === period);
  if (idx >= 0) db.entries.splice(idx, 1);
  return { ok: true as const };
}
