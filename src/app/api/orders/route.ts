import { NextResponse } from "next/server";
import { orders } from "@/lib/store";

export async function GET() {
  return NextResponse.json(orders);
}
