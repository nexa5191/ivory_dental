import { NextResponse } from "next/server";
import { listInvoices, addInvoice } from "@/lib/clinic";

export async function GET() {
  return NextResponse.json(listInvoices());
}

export async function POST(req: Request) {
  const body = await req.json();
  const invoice = addInvoice(body);
  return NextResponse.json(invoice, { status: 201 });
}
