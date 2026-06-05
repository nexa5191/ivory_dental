import { NextResponse } from "next/server";
import { completeVendorInvite } from "@/lib/vendors";

// A prospective vendor submits their registration against an invite token.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const body = await req.json();
  const vendor = completeVendorInvite(params.token, body);
  if (!vendor) {
    return NextResponse.json({ error: "Invalid or already-used invite link." }, { status: 400 });
  }
  return NextResponse.json({ id: vendor.id, name: vendor.name }, { status: 201 });
}
