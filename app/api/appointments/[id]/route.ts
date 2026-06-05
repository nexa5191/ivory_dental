import { NextResponse } from "next/server";
import { updateAppointment } from "@/lib/clinic";

// Patches status and/or reschedule fields (start, durationMin, chair, …).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = updateAppointment(params.id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
