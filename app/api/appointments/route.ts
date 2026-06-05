import { NextResponse } from "next/server";
import { listAppointments, addAppointment } from "@/lib/clinic";

export async function GET() {
  return NextResponse.json(listAppointments());
}

export async function POST(req: Request) {
  const body = await req.json();
  const appt = addAppointment(body);
  return NextResponse.json(appt, { status: 201 });
}
