import { NextResponse } from "next/server";
import { payPO } from "@/lib/vendors";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const po = payPO(params.id, body);
  if (!po) return NextResponse.json({ error: "Cannot record payment — invoice required first" }, { status: 400 });
  return NextResponse.json(po);
}
