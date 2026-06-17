import { NextResponse } from "next/server";
import { listCreditLedger } from "@/lib/credit-ledger";

export async function GET() {
  return NextResponse.json(listCreditLedger());
}
