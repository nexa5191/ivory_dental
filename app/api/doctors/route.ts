import { NextResponse } from "next/server";
import { addProvider } from "@/lib/clinic";

export async function POST(req: Request) {
  const body = await req.json();
  const created = addProvider(body);
  return NextResponse.json(created, { status: 201 });
}
