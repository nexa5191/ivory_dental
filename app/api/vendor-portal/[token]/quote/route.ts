import { NextResponse } from "next/server";
import { submitQuoteByToken } from "@/lib/vendors";

// Public endpoint: a vendor submits/revises a bid via their unique portal link.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const { rfqId, ...input } = await req.json();
  const r = submitQuoteByToken(params.token, rfqId, input);
  if (!r) return NextResponse.json({ error: "Could not submit quote" }, { status: 400 });
  return NextResponse.json({ ok: true, rfqId: r.id });
}
