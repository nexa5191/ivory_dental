import { NextResponse } from "next/server";
import { computeSetOff, gstr3bLateCharges, type HeadAmounts } from "@/lib/gst";
import { cashBalances, settle3B, reverse3B, isFiled3B } from "@/lib/cash-ledger";
import { creditBalances, accrueCredit, utiliseCredit, reverseCreditFor } from "@/lib/credit-ledger";

// File GSTR-3B with set-off: offset output liability with ITC (credit ledger) per
// the statutory order, then pay the balance from the cash ledger and lock.
// Body: { action: "file"|"reverse", period, liability?, itc? }
export async function POST(req: Request) {
  const body = await req.json();
  const { action, period } = body as { action?: string; period?: string };
  if (!period) return NextResponse.json({ ok: false, error: "Pick a return period." }, { status: 400 });

  if (action === "reverse") {
    const r = reverse3B(period);
    if (!r.ok) return NextResponse.json(r, { status: 400 });
    reverseCreditFor(period);
    return NextResponse.json({ ok: true });
  }

  if (action === "file") {
    if (isFiled3B(period)) return NextResponse.json({ ok: false, error: `GSTR-3B for ${period} is already filed & locked.` }, { status: 400 });
    const liability = sanitize(body.liability);
    const itc = sanitize(body.itc);
    // available credit = current credit ledger balance + this period's ITC (to be accrued)
    const bal = creditBalances();
    const avail: HeadAmounts = { igst: bal.igst + itc.igst, cgst: bal.cgst + itc.cgst, sgst: bal.sgst + itc.sgst };
    const so = computeSetOff(liability, avail);
    // late fee + interest if filed after the due date (paid in cash, on top of tax)
    const cashTax = so.cashPayable.igst + so.cashPayable.cgst + so.cashPayable.sgst;
    const lc = gstr3bLateCharges(period, cashTax);
    const cashPay: HeadAmounts = {
      igst: round2(so.cashPayable.igst + lc.interest),
      cgst: round2(so.cashPayable.cgst + lc.lateFeeCgst),
      sgst: round2(so.cashPayable.sgst + lc.lateFeeSgst),
    };
    // pay the cash portion first (validates cash balance + locks the period)
    const settle = settle3B({ period, igst: cashPay.igst, cgst: cashPay.cgst, sgst: cashPay.sgst });
    if (!settle.ok) return NextResponse.json(settle, { status: 400 });
    // then post the credit movements
    accrueCredit({ ...itc, ref: `ITC ${period}`, period });
    utiliseCredit({ ...so.creditUsed, period });
    return NextResponse.json({ ok: true, setoff: so, lateCharges: lc });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function sanitize(h: unknown): HeadAmounts {
  const o = (h ?? {}) as Record<string, unknown>;
  const n = (v: unknown) => Math.max(0, Number(v) || 0);
  return { igst: n(o.igst), cgst: n(o.cgst), sgst: n(o.sgst) };
}
