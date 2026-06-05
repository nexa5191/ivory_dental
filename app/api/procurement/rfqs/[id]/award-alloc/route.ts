import { NextResponse } from "next/server";
import { awardRfqAllocations } from "@/lib/vendors";

// Allocation award: body { allocations: [{ itemName, vendorId, qty, unitPrice }] }.
// Splits each line's qty across vendors at (possibly renegotiated) unit prices.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { allocations } = await req.json();
  const pos = awardRfqAllocations(params.id, allocations ?? []);
  if (!pos) return NextResponse.json({ error: "Could not award" }, { status: 400 });
  return NextResponse.json({ pos: pos.map((p) => p.id) }, { status: 201 });
}
