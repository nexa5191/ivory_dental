import { NextResponse } from "next/server";
import { deleteProduct, getProduct, upsertProduct } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = getProduct(params.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const saved = upsertProduct({ ...body, id: params.id });
  return NextResponse.json(saved);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = deleteProduct(params.id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
