import { NextResponse } from "next/server";
import { addPrescription, prescriptionsFor } from "@/lib/clinic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  if (!patientId) return NextResponse.json({ error: "patientId required" }, { status: 400 });
  return NextResponse.json(prescriptionsFor(patientId));
}

export async function POST(req: Request) {
  const body = await req.json();
  const rx = addPrescription(body);
  return NextResponse.json(rx, { status: 201 });
}
