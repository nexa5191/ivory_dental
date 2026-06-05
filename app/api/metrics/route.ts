import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getMetrics());
}
