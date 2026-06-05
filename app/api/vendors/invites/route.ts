import { NextResponse } from "next/server";
import { listVendorInvites, createVendorInvite } from "@/lib/vendors";

export async function GET() {
  return NextResponse.json(listVendorInvites());
}

// Create a self-registration invite. Mock-"sends" via email/SMS (no real send).
export async function POST(req: Request) {
  const body = await req.json();
  const invite = createVendorInvite({ email: body.email, phone: body.phone, note: body.note });
  return NextResponse.json(invite, { status: 201 });
}
