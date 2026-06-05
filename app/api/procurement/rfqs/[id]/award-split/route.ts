import { NextResponse } from "next/server";
import { awardRfqSplit } from "@/lib/vendors";

// Split / partial award: body { assignments: [{ itemName, vendorId }] }.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { assignments } = await req.json();
  const pos = awardRfqSplit(params.id, assignments ?? []);
  if (!pos) return NextResponse.json({ error: "Could not award" }, { status: 400 });
  return NextResponse.json({ pos: pos.map((p) => p.id) }, { status: 201 });
}
