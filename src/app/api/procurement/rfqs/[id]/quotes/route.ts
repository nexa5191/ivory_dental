import { NextResponse } from "next/server";
import { simulateQuotes } from "@/lib/vendors";

// Demo stand-in for vendors replying over email/SMS: generates quotes from every
// invited vendor that hasn't responded yet.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const r = simulateQuotes(params.id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(r);
}
