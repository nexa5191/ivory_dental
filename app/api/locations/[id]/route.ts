import { NextResponse } from "next/server";
import { updateLocation } from "@/lib/clinic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = updateLocation(params.id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
