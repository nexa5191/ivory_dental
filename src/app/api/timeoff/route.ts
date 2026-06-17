import { NextResponse } from "next/server";
import { addTimeOff } from "@/lib/clinic";

export async function POST(req: Request) {
  const body = await req.json();
  const created = addTimeOff(body);
  if (!created) return NextResponse.json({ error: "providerId and from date required" }, { status: 400 });
  return NextResponse.json(created, { status: 201 });
}
