import { NextResponse } from "next/server";
import { invoicePO } from "@/lib/vendors";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const po = invoicePO(params.id, body);
  if (!po) return NextResponse.json({ error: "Cannot invoice this PO" }, { status: 400 });
  return NextResponse.json(po);
}
