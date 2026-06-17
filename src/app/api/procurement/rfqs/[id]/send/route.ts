import { NextResponse } from "next/server";
import { sendRfq } from "@/lib/vendors";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const r = sendRfq(params.id);
  if (!r) return NextResponse.json({ error: "Cannot send — no vendors invited" }, { status: 400 });
  return NextResponse.json(r);
}
