import { NextResponse } from "next/server";
import { createRfq } from "@/lib/vendors";

export async function POST(req: Request) {
  const body = await req.json();
  const created = createRfq(body);
  return NextResponse.json(created, { status: 201 });
}
