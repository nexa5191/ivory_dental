// Server-side GST taxpayer resolver. Calls a real GST taxpayer-search provider
// when an API key is configured, otherwise falls back to the deterministic mock.
//
// Config (env):
//   GST_API_KEY       — provider key/secret (required for live data)
//   GST_API_PROVIDER  — "appyflow" (default) | "custom"
//   GST_API_URL       — for "custom": a URL with {gstin} and {key} placeholders
//
// Without GST_API_KEY the resolver returns fabricated demo data (source: "mock").

import { gstLookup, stateName, panFromGstin, type GstRegistrant } from "./gst";

export interface GstResolveResult {
  registrant: GstRegistrant | null;
  source: "live" | "mock";
  error?: string;
}

export async function gstResolve(gstinRaw: string): Promise<GstResolveResult> {
  const gstin = (gstinRaw ?? "").trim().toUpperCase();
  const key = process.env.GST_API_KEY;
  if (key) {
    try {
      const live = await fetchLive(gstin, key);
      if (live) return { registrant: live, source: "live" };
    } catch (e) {
      // fall through to mock, but surface why
      return { registrant: gstLookup(gstin), source: "mock", error: e instanceof Error ? e.message : "live lookup failed" };
    }
  }
  return { registrant: gstLookup(gstin), source: "mock" };
}

async function fetchLive(gstin: string, key: string): Promise<GstRegistrant | null> {
  const provider = process.env.GST_API_PROVIDER || "appyflow";
  const url =
    provider === "custom" && process.env.GST_API_URL
      ? process.env.GST_API_URL.replace("{gstin}", encodeURIComponent(gstin)).replace("{key}", encodeURIComponent(key))
      : `https://appyflow.in/api/verifyGST?gstNo=${encodeURIComponent(gstin)}&key_secret=${encodeURIComponent(key)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`provider HTTP ${res.status}`);
  const j = await res.json();
  // Appyflow shape: { taxpayerInfo: { lgnm, tradeNam, pradr:{ adr, addr:{ dst,loc,pncd,stcd,... } }, dty, sts } }
  const t = j?.taxpayerInfo ?? j?.data?.taxpayerInfo ?? j?.data;
  if (!t || j?.error === true) return null;
  const addr = t.pradr?.addr ?? {};
  const stateCode = gstin.slice(0, 2);
  return {
    gstin,
    pan: panFromGstin(gstin),
    stateCode,
    stateName: stateName(stateCode),
    legalName: t.lgnm ?? t.legalName ?? "",
    tradeName: t.tradeNam || t.tradeName || t.lgnm || "",
    address: t.pradr?.adr ?? [addr.flno, addr.bno, addr.bnm, addr.st, addr.loc].filter(Boolean).join(", "),
    city: addr.dst || addr.loc || "",
    pincode: addr.pncd || "",
    taxpayerType: t.dty || t.taxpayerType || "Regular",
    taxpayerStatus: t.sts || t.taxpayerStatus || "Active",
  };
}
