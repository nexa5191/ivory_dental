import { NextResponse } from "next/server";
import { getProvider, updateProvider, deleteProvider } from "@/lib/db/providers";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const provider = await getProvider(id);
  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(provider);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json();
  return NextResponse.json(await updateProvider(id, body));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await deleteProvider(id);
  return new NextResponse(null, { status: 204 });
}
