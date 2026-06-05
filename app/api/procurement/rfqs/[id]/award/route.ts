import { NextResponse } from "next/server";
import { awardRfq } from "@/lib/vendors";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { vendorId } = await req.json();
  const po = awardRfq(params.id, vendorId);
  if (!po) return NextResponse.json({ error: "Could not award — no matching quote" }, { status: 400 });
  return NextResponse.json(po, { status: 201 });
}
