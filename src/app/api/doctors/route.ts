import { NextResponse } from "next/server";
import { listProviders, createProvider } from "@/lib/db/providers";

export async function GET() {
  return NextResponse.json(await listProviders());
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name || !body.specialty || !body.reg)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  return NextResponse.json(await createProvider(body), { status: 201 });
}
