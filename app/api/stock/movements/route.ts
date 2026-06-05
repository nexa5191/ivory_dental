import { NextResponse } from "next/server";
import { recordMovement } from "@/lib/store";

// Record inventory consumption ("out") or a receipt ("in"); adjusts on-hand stock.
export async function POST(req: Request) {
  const body = await req.json();
  const res = recordMovement(body);
  if (!res) return NextResponse.json({ error: "Invalid product or quantity" }, { status: 400 });
  return NextResponse.json(res, { status: 201 });
}
