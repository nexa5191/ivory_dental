import { NextResponse } from "next/server";
import { receivePO } from "@/lib/vendors";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const po = receivePO(params.id, body);
  if (!po) return NextResponse.json({ error: "Cannot receive against this PO" }, { status: 400 });
  return NextResponse.json(po);
}
