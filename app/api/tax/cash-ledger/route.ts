import { NextResponse } from "next/server";
import { listCashLedger, addDeposit, settle3B, reverse3B } from "@/lib/cash-ledger";

export async function GET() {
  return NextResponse.json(listCashLedger());
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body as { action?: string };
  if (action === "deposit") {
    const r = addDeposit({ igst: Number(body.igst) || 0, cgst: Number(body.cgst) || 0, sgst: Number(body.sgst) || 0, ref: body.ref, date: body.date });
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "settle") {
    const r = settle3B({ period: body.period, igst: Number(body.igst) || 0, cgst: Number(body.cgst) || 0, sgst: Number(body.sgst) || 0 });
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "reverse") {
    const r = reverse3B(body.period);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
