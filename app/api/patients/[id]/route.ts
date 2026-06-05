import { NextResponse } from "next/server";
import { getPatient, upsertPatient } from "@/lib/clinic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const p = getPatient(params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(p);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const saved = upsertPatient({ ...body, id: params.id });
  return NextResponse.json(saved);
}
