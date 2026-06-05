import { NextResponse } from "next/server";
import { listProducts, upsertProduct } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listProducts());
}

export async function POST(req: Request) {
  const body = await req.json();
  const saved = upsertProduct(body);
  return NextResponse.json(saved, { status: body.id ? 200 : 201 });
}
