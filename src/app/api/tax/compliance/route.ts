import { NextResponse } from "next/server";
import { updateCompliance, getCompliance, type ComplianceAction } from "@/lib/compliance";

const ACTIONS = [
  "fileGstr1", "unfileGstr1", "holdGstr1", "unholdGstr1",
  "claimItc", "unclaimItc", "holdItc", "unholdItc",
  "depositTds", "undepositTds", "certifyTds", "uncertifyTds",
];

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json(getCompliance(id));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, action, ref, period } = body as { id?: string; action?: string; ref?: string; period?: string };
  if (!id || !action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "id and a valid action are required" }, { status: 400 });
  }
  const rec = updateCompliance(id, action as ComplianceAction, ref, period);
  return NextResponse.json(rec);
}
