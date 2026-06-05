import { NextResponse } from "next/server";
import { closePO } from "@/lib/vendors";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { reason } = await req.json().catch(() => ({ reason: undefined }));
  const po = closePO(params.id, reason);
  if (!po) return NextResponse.json({ error: "Cannot close this PO" }, { status: 400 });
  return NextResponse.json(po);
}
