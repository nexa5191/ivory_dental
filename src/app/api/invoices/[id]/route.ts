import { NextResponse } from "next/server";
import { recordPayment, setInvoiceStatus } from "@/lib/clinic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated =
    typeof body.amount === "number"
      ? recordPayment(params.id, { amount: body.amount, mode: body.mode, reference: body.reference })
      : setInvoiceStatus(params.id, body.status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
