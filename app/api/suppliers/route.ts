import { NextResponse } from "next/server";
import { suppliers } from "@/lib/store";

export async function GET() {
  return NextResponse.json(suppliers);
}
