import { NextResponse } from "next/server";
import { addVendor } from "@/lib/vendors";

export async function POST(req: Request) {
  const body = await req.json();
  const created = addVendor(body);
  return NextResponse.json(created, { status: 201 });
}
