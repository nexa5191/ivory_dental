import { NextResponse } from "next/server";
import { listGstr1Filings, fileGstr1Period, unfileGstr1Period } from "@/lib/compliance";

export async function GET() {
  return NextResponse.json(listGstr1Filings());
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action, period } = body as { action?: string; period?: string };
  if (action === "file") {
    const r = fileGstr1Period(period ?? "");
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "unfile") {
    const r = unfileGstr1Period(period ?? "");
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
