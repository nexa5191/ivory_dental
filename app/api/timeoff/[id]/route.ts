import { NextResponse } from "next/server";
import { removeTimeOff } from "@/lib/clinic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = removeTimeOff(params.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
