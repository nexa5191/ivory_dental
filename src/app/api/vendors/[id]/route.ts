import { NextResponse } from "next/server";
import { updateVendor } from "@/lib/vendors";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = updateVendor(params.id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
