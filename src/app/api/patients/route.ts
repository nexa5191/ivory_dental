import { NextResponse } from "next/server";
import { listPatients, createPatient } from "@/lib/db/patients";

export async function GET() {
  return NextResponse.json(await listPatients());
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name || !body.phone)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  return NextResponse.json(await createPatient(body), { status: 201 });
}
