import { NextResponse } from "next/server";
import { gstResolve } from "@/lib/gst-api";

// POST { gstin } → resolves to real registrant data (live provider) or mock.
export async function POST(req: Request) {
  const { gstin } = (await req.json()) as { gstin?: string };
  if (!gstin?.trim()) {
    return NextResponse.json({ success: false, message: "gstin required" }, { status: 400 });
  }
  const { registrant, source, error } = await gstResolve(gstin);
  if (!registrant) {
    return NextResponse.json({ success: false, message: "GSTIN not found on the portal." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: registrant, source, error });
}
