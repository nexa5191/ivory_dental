// Server-side builder that turns billing + purchase data into the GST/TDS rows
// the Tax reports consume. Shared by the Reports hub (Tax sub-page).

import { listInvoices, getPatient, listLocations, getLocation, patientLocation } from "@/lib/clinic";
import { listPurchaseOrders, getVendor } from "@/lib/vendors";
import {
  classifyService, classifyGoods, splitInclusive, stateCodeFromGstin, stateName,
  isInterState, fyOf, monthKeyOf, tdsAmount, HOME_STATE_CODE,
} from "@/lib/gst";
import { snapshotCompliance, listGstr1Filings } from "@/lib/compliance";
import type { SalesRow, PurchaseRow, PurchaseBill, SalesTdsRow, RcmRow, JobWorkRow } from "@/components/clinic/tax-client";

// Rate at which corporate/insurer (B2B) clients withhold TDS on our professional
// fees (sec. 194J). Surfaces as TDS receivable until the 16A certificate arrives.
const TDS_RECEIVABLE_RATE = 10;

export interface TaxData {
  sales: SalesRow[];
  purchases: PurchaseRow[];
  bills: PurchaseBill[];
  salesTds: SalesTdsRow[];
  rcm: RcmRow[];
  jobwork: JobWorkRow[];
  branches: { id: string; name: string; gstin: string }[];
}

// Reverse-charge inward supplies (the clinic self-pays GST). Intra-state (CGST+SGST).
function rcmSeed(): RcmRow[] {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const mk = (date: string, supplier: string, desc: string, code: string, rate: number, taxable: number): RcmRow => {
    const tax = round2(taxable * (rate / 100));
    return {
      key: `${supplier}-${date}`, date, period: monthKeyOf(date), fy: fyOf(date),
      supplier, desc, code, rate, taxable: round2(taxable),
      cgst: round2(tax / 2), sgst: round2(tax - round2(tax / 2)), igst: 0, tax, interState: false,
    };
  };
  return [
    mk("2026-04-09T11:00:00Z", "BlueDart Logistics (GTA)", "Goods transport — equipment freight", "996791", 5, 18),
    mk("2026-05-03T11:00:00Z", "Adv. R. Menon", "Legal & professional services", "998213", 18, 12),
    mk("2026-05-22T11:00:00Z", "SecureGuard Services", "Security services", "998529", 18, 9),
    mk("2026-06-02T11:00:00Z", "BlueDart Logistics (GTA)", "Goods transport — consumables freight", "996791", 5, 8),
  ];
}

// ITC-04 job-work challans — impressions/materials sent to the lab, prosthetics back.
function jobWorkSeed(): JobWorkRow[] {
  const mk = (challanNo: string, date: string, itemSent: string, qtySent: number, itemReceived: string, qtyReceived: number, status: "sent" | "received", taxableValue: number): JobWorkRow => ({
    key: challanNo, challanNo, date, period: monthKeyOf(date), fy: fyOf(date),
    jobWorker: "Apex Dental Laboratory", itemSent, qtySent, itemReceived, qtyReceived, status, taxableValue,
  });
  return [
    mk("JW-2026-021", "2026-04-15T11:00:00Z", "Impressions + Zirconia blanks", 6, "Zirconia crowns", 6, "received", 270),
    mk("JW-2026-027", "2026-05-12T11:00:00Z", "Impressions + alloy", 4, "PFM crowns", 4, "received", 150),
    mk("JW-2026-033", "2026-05-28T11:00:00Z", "Impressions (implant case)", 2, "Custom abutments", 0, "sent", 120),
    mk("JW-2026-038", "2026-06-01T11:00:00Z", "Impressions", 3, "Crowns", 0, "sent", 95),
  ];
}

export function getTaxData(): TaxData {
  const HOME = stateName(HOME_STATE_CODE);
  const locations = listLocations();
  const primaryGstin = locations[0]?.gstin ?? "29ABCDE1234F1Z5";
  const compliance = snapshotCompliance();
  const gstr1Locks = listGstr1Filings();
  const round2 = (n: number) => Math.round(n * 100) / 100;

  // ── Outward supplies (sales) → one row per line item; B2B = patient has GSTIN ──
  const sales: SalesRow[] = [];
  const salesTds: SalesTdsRow[] = [];
  for (const inv of listInvoices()) {
    const patient = getPatient(inv.patientId);
    const branch = patientLocation(inv.patientId);
    const gstin = getLocation(branch)?.gstin ?? primaryGstin;
    const b2b = !!patient?.gstin;
    const cr = compliance[inv.id] ?? {};
    let invTotal = 0;
    inv.items.forEach((it, i) => {
      const cls = classifyService(it.desc);
      const sp = splitInclusive(it.amount, cls.rate, false);
      invTotal += sp.gross;
      sales.push({
        key: `${inv.id}-${i}`, invoiceId: inv.id, date: inv.date, period: monthKeyOf(inv.date), fy: fyOf(inv.date),
        patientId: inv.patientId, patientName: patient?.name ?? inv.patientId, recipientGstin: patient?.gstin ?? "",
        branch, gstin, desc: it.desc, code: cls.code, kind: cls.kind, codeDesc: cls.desc, rate: cls.rate,
        taxable: sp.taxable, cgst: sp.cgst, sgst: sp.sgst, igst: sp.igst, tax: sp.tax, gross: sp.gross,
        interState: false, placeOfSupply: HOME, supplyType: b2b ? "B2B" : "B2C",
        gstr1Filed: !!cr.gstr1Filed, gstr1Ref: cr.gstr1Ref ?? "", gstr1Period: cr.gstr1Period ?? "", gstr1Held: !!cr.gstr1Held,
        periodLocked: !!gstr1Locks[monthKeyOf(inv.date)],
        status: inv.status,
      });
    });
    if (b2b && patient) {
      const tc = compliance[`tdsr:${inv.id}`] ?? {};
      salesTds.push({
        key: inv.id, invoiceId: inv.id, date: inv.date, period: monthKeyOf(inv.date), fy: fyOf(inv.date),
        clientName: patient.name, clientGstin: patient.gstin ?? "",
        base: round2(invTotal), rate: TDS_RECEIVABLE_RATE, tds: tdsAmount(invTotal, TDS_RECEIVABLE_RATE),
        certified: !!tc.tdsCertified, certNo: tc.certNo ?? "", status: inv.status,
      });
    }
  }

  // ── Inward supplies (vendor bills) → ITC + per-bill TDS / MSME ──
  const purchases: PurchaseRow[] = [];
  const bills: PurchaseBill[] = [];
  for (const po of listPurchaseOrders()) {
    if (!po.invoice) continue;
    const vendor = getVendor(po.vendorId);
    const supplierStateCode = stateCodeFromGstin(vendor?.gstin);
    const inter = isInterState(supplierStateCode);
    const msme = vendor?.msme ?? false;
    const poc = compliance[po.id] ?? {};
    const itcClaimed = !!poc.itcClaimed;
    const itcPeriod = poc.itcPeriod ?? "";
    const itcHeld = !!poc.itcHeld;
    const tdsRec = compliance[`tdsp:${po.id}`] ?? {};
    let billTaxable = 0;
    let billTax = 0;
    po.items.forEach((l, i) => {
      const cls = classifyGoods(l.itemName);
      const sp = splitInclusive(l.unitPrice * l.qty, cls.rate, inter);
      billTaxable += sp.taxable;
      billTax += sp.tax;
      purchases.push({
        key: `${po.id}-${i}`, poId: po.id, billNo: po.invoice!.number, date: po.invoice!.date,
        period: monthKeyOf(po.invoice!.date), fy: fyOf(po.invoice!.date),
        vendorId: po.vendorId, vendorName: vendor?.name ?? po.vendorId, vendorGstin: vendor?.gstin ?? "—",
        supplierState: stateName(supplierStateCode), msme, itemName: l.itemName,
        code: cls.code, kind: cls.kind, codeDesc: cls.desc, rate: cls.rate,
        taxable: sp.taxable, cgst: sp.cgst, sgst: sp.sgst, igst: sp.igst, tax: sp.tax, gross: sp.gross,
        interState: inter, itcClaimed, itcPeriod, itcHeld, status: po.status === "paid" ? "paid" : "invoiced",
      });
    });
    const tdsRate = vendor?.tds?.rate ?? 0;
    const tds = vendor?.tds ? tdsAmount(billTaxable, tdsRate) : 0;
    bills.push({
      key: po.id, poId: po.id, billNo: po.invoice.number, date: po.invoice.date,
      period: monthKeyOf(po.invoice.date), fy: fyOf(po.invoice.date),
      vendorId: po.vendorId, vendorName: vendor?.name ?? po.vendorId, vendorPan: vendor?.pan ?? "—",
      vendorGstin: vendor?.gstin ?? "—", supplierState: stateName(supplierStateCode), msme,
      taxable: round2(billTaxable), tax: round2(billTax), gross: po.invoice.amount, itcClaimed,
      tdsSection: vendor?.tds?.section ?? "", tdsRate, tds,
      tdsDeposited: !!tdsRec.tdsDeposited, challanNo: tdsRec.challanNo ?? "",
      netPayable: round2(po.invoice.amount - tds), interState: inter,
      status: po.status === "paid" ? "paid" : "invoiced",
    });
  }

  return { sales, purchases, bills, salesTds, rcm: rcmSeed(), jobwork: jobWorkSeed(), branches: locations.map((l) => ({ id: l.id, name: l.name, gstin: l.gstin })) };
}
