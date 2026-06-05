import { NextResponse } from "next/server";
import { addLocation } from "@/lib/clinic";

export async function POST(req: Request) {
  const body = await req.json();
  const created = addLocation(body);
  if (!created) {
    return NextResponse.json(
      { error: "A branch with that name already exists, or the name is empty." },
      { status: 409 }
    );
  }
  return NextResponse.json(created, { status: 201 });
}
