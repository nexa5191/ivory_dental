import { NextResponse } from "next/server";
import { listPatients, upsertPatient } from "@/lib/clinic";

export async function GET() {
  return NextResponse.json(listPatients());
}

export async function POST(req: Request) {
  const body = await req.json();
  const saved = upsertPatient(body);
  return NextResponse.json(saved, { status: body.id ? 200 : 201 });
}
