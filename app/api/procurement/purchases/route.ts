import { NextResponse } from "next/server";
import { addManualPurchase } from "@/lib/vendors";

// Direct purchase entry that bypasses the RFQ → quote → PO-approval flow.
export async function POST(req: Request) {
  const body = await req.json();
  const po = addManualPurchase(body);
  if (!po) return NextResponse.json({ error: "Invalid purchase — vendor and at least one item required" }, { status: 400 });
  return NextResponse.json(po, { status: 201 });
}
