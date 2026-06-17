"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, ChevronUp, ChevronRight, Plus, X, SlidersHorizontal, GripVertical,
  FileDown, Check, Clock, Loader2, Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { cn, formatDate as fmtDate } from "@/lib/utils";
import { GST_RATES, rateLabel, monthLabel, periodRange, computeSetOff, gstr3bLateCharges, type TaxKind, type HeadAmounts } from "@/lib/gst";
import type { CashEntry } from "@/lib/cash-ledger";
import type { CreditEntry } from "@/lib/credit-ledger";

// ──────────────────────────────────────────────────────────────────────────
// Incoming row shapes (computed server-side in app/tax/page.tsx)
// ──────────────────────────────────────────────────────────────────────────
export interface SalesRow {
  key: string; invoiceId: string; date: string; period: string; fy: string;
  patientId: string; patientName: string; recipientGstin: string;
  branch: string; gstin: string;
  desc: string; code: string; kind: TaxKind; codeDesc: string; rate: number;
  taxable: number; cgst: number; sgst: number; igst: number; tax: number; gross: number;
  interState: boolean; placeOfSupply: string; supplyType: "B2B" | "B2C";
  gstr1Filed: boolean; gstr1Ref: string; gstr1Period: string; gstr1Held: boolean; periodLocked: boolean;
  status: "paid" | "partial" | "due";
}

export interface PurchaseRow {
  key: string; poId: string; billNo: string; date: string; period: string; fy: string;
  vendorId: string; vendorName: string; vendorGstin: string; supplierState: string; msme: boolean;
  itemName: string; code: string; kind: TaxKind; codeDesc: string; rate: number;
  taxable: number; cgst: number; sgst: number; igst: number; tax: number; gross: number;
  interState: boolean; itcClaimed: boolean; itcPeriod: string; itcHeld: boolean; status: "paid" | "invoiced";
}

export interface PurchaseBill {
  key: string; poId: string; billNo: string; date: string; period: string; fy: string;
  vendorId: string; vendorName: string; vendorPan: string; vendorGstin: string; supplierState: string; msme: boolean;
  taxable: number; tax: number; gross: number; itcClaimed: boolean;
  tdsSection: string; tdsRate: number; tds: number; tdsDeposited: boolean; challanNo: string;
  netPayable: number; interState: boolean; status: "paid" | "invoiced";
}

export interface SalesTdsRow {
  key: string; invoiceId: string; date: string; period: string; fy: string;
  clientName: string; clientGstin: string;
  base: number; rate: number; tds: number; certified: boolean; certNo: string;
  status: "paid" | "partial" | "due";
}

// Inward supplies liable to reverse charge (clinic pays the GST under RCM).
export interface RcmRow {
  key: string; date: string; period: string; fy: string;
  supplier: string; desc: string; code: string; rate: number;
  taxable: number; cgst: number; sgst: number; igst: number; tax: number; interState: boolean;
}

// ITC-04 job-work challans — goods sent to / received from a job worker (lab).
export interface JobWorkRow {
  key: string; challanNo: string; date: string; period: string; fy: string;
  jobWorker: string; itemSent: string; qtySent: number;
  itemReceived: string; qtyReceived: number; status: "sent" | "received"; taxableValue: number;
}

interface Branch { id: string; name: string; gstin: string }

interface Filters {
  period: string; branch: string; rate: string;
  nature: "all" | "intra" | "inter";
  supply: "all" | "B2B" | "B2C";
  recon: "all" | "pending" | "done";
  sortBy: "date" | "amount" | "name"; sortOrder: "asc" | "desc";
}

const DEFAULT_FILTERS: Filters = {
  period: "all", branch: "all", rate: "all", nature: "all", supply: "all", recon: "all",
  sortBy: "date", sortOrder: "desc",
};

type Row = Record<string, unknown>;

interface Column { key: string; label: string; align?: "right"; sum?: boolean; cell: (r: Row) => React.ReactNode }

interface Data { sales: SalesRow[]; purchases: PurchaseRow[]; bills: PurchaseBill[]; salesTds: SalesTdsRow[]; rcm: RcmRow[]; jobwork: JobWorkRow[]; branches: Branch[] }

// what the expand panel needs to drive compliance actions
interface DetailSpec {
  id: (r: Row) => string;
  done: (r: Row) => boolean;
  title: string;
  doneLabel: string;
  pendingLabel: string;
  doAction: string;
  undoAction: string;
  refLabel?: string; // if the "do" action needs a reference number
  refExample?: string;
  periodSelect?: boolean; // include a return-period picker when tagging
  returnName?: string; // e.g. "GSTR-1", "GSTR-3B" — used in the include/hold copy
  held?: (r: Row) => boolean; // deliberately excluded from the return (on hold)
  holdAction?: string;
  unholdAction?: string;
  locked?: (r: Row) => boolean; // period filed & locked — actions disabled
}

interface ReportDef {
  key: string; label: string; blurb: string;
  columns: Column[];
  build: (d: Data, f: Filters) => Row[];
  totals?: boolean;
  summary?: boolean;
  detail?: DetailSpec; // expandable compliance panel
  custom?: "cashLedger" | "creditLedger"; // renders a bespoke panel instead of the generic table
}

// ──────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────
const money = (r: Row, k: string) => <Money value={(r[k] as number) ?? 0} />;
const num = (n: number) => Math.round(n * 100) / 100;

function inPeriod(iso: string, period: string) {
  if (period === "all") return true;
  const { from, to } = periodRange(period);
  const d = iso.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function codeCell(r: Row) {
  return (
    <span className="font-mono text-xs">
      {r.code as string}
      <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[9px] uppercase text-muted-foreground">{r.kind as string}</span>
    </span>
  );
}
const rateCell = (r: Row) => <Badge variant={(r.rate as number) === 0 ? "muted" : "default"}>{rateLabel(r.rate as number)}</Badge>;
const natureCell = (r: Row) => (
  <span className={(r.interState as boolean) ? "text-warning" : "text-muted-foreground"}>
    {(r.interState as boolean) ? "Inter" : "Intra"}
  </span>
);
const msmeCell = (r: Row) => ((r.msme as boolean) ? <Badge variant="good">MSME</Badge> : <span className="text-muted-foreground">—</span>);
function doneBadge(done: boolean, doneText: string, pendingText: string) {
  return done ? (
    <Badge variant="good"><Check className="size-3" />{doneText}</Badge>
  ) : (
    <Badge variant="low"><Clock className="size-3" />{pendingText}</Badge>
  );
}
// status badge that also surfaces the return period it was filed/claimed in, and a
// distinct "Held" state for documents deliberately excluded from a return.
function reconStatusCell(done: boolean, held: boolean, period: string, doneText: string, pendingText: string) {
  if (held) return <Badge variant="muted">Held</Badge>;
  if (done) return <Badge variant="good"><Check className="size-3" />{doneText}{period ? ` · ${monthLabel(period)}` : ""}</Badge>;
  return <Badge variant="low"><Clock className="size-3" />{pendingText}</Badge>;
}

function filterSales(d: Data, f: Filters): SalesRow[] {
  return d.sales
    .filter((r) => inPeriod(r.date, f.period))
    .filter((r) => f.branch === "all" || r.branch === f.branch)
    .filter((r) => f.rate === "all" || r.rate === Number(f.rate))
    .filter((r) => f.nature === "all" || (f.nature === "inter" ? r.interState : !r.interState))
    .filter((r) => f.supply === "all" || r.supplyType === f.supply)
    .filter((r) => f.recon === "all" || (f.recon === "done" ? r.gstr1Filed : !r.gstr1Filed && !r.gstr1Held));
}
function filterPurchases(d: Data, f: Filters): PurchaseRow[] {
  return d.purchases
    .filter((r) => inPeriod(r.date, f.period))
    .filter((r) => f.rate === "all" || r.rate === Number(f.rate))
    .filter((r) => f.nature === "all" || (f.nature === "inter" ? r.interState : !r.interState))
    .filter((r) => f.recon === "all" || (f.recon === "done" ? r.itcClaimed : !r.itcClaimed && !r.itcHeld));
}
function filterBills(d: Data, f: Filters): PurchaseBill[] {
  return d.bills
    .filter((r) => inPeriod(r.date, f.period))
    .filter((r) => f.nature === "all" || (f.nature === "inter" ? r.interState : !r.interState));
}

interface Agg { taxable: number; cgst: number; sgst: number; igst: number; tax: number; gross: number }
const zero = (): Agg => ({ taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, gross: 0 });
function addAgg(a: Agg, r: { taxable: number; cgst: number; sgst: number; igst: number; tax: number; gross: number }) {
  a.taxable += r.taxable; a.cgst += r.cgst; a.sgst += r.sgst; a.igst += r.igst; a.tax += r.tax; a.gross += r.gross;
}
const roundAgg = (a: Agg): Agg => ({
  taxable: num(a.taxable), cgst: num(a.cgst), sgst: num(a.sgst), igst: num(a.igst), tax: num(a.tax), gross: num(a.gross),
});

function sortRows(rows: Row[], f: Filters): Row[] {
  const key = f.sortBy === "amount" ? "_amount" : f.sortBy === "name" ? "_name" : "_date";
  const out = [...rows].sort((a, b) => {
    const av = a[key] as string | number | undefined;
    const bv = b[key] as string | number | undefined;
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return av < bv ? -1 : av > bv ? 1 : 0;
  });
  return f.sortOrder === "desc" ? out.reverse() : out;
}

const TAX_COLS = (prefix: "cgst" | "sgst" | "igst" | "tax"): Column => {
  const labels = { cgst: "CGST", sgst: "SGST", igst: "IGST", tax: "Total tax" } as const;
  return { key: prefix, label: labels[prefix], align: "right", sum: true, cell: (r) => money(r, prefix) };
};

// ──────────────────────────────────────────────────────────────────────────
// report definitions
// ──────────────────────────────────────────────────────────────────────────
const REPORTS: ReportDef[] = [
  {
    key: "gstr1",
    label: "GSTR-1",
    blurb: "Outward supplies. Unregistered patients are B2C (intra-state CGST+SGST); patients with a GSTIN are B2B. Tag each invoice once it is reported, to spot anything unfiled.",
    totals: true,
    detail: {
      id: (r) => r.invoiceId as string,
      done: (r) => r.gstr1Filed as boolean,
      title: "GSTR-1 filing",
      doneLabel: "Filed",
      pendingLabel: "Not filed",
      doAction: "fileGstr1",
      undoAction: "unfileGstr1",
      refLabel: "GSTR-1 ARN / ref",
      refExample: "AA2906250012345",
      periodSelect: true,
      returnName: "GSTR-1",
      held: (r) => r.gstr1Held as boolean,
      holdAction: "holdGstr1",
      unholdAction: "unholdGstr1",
      locked: (r) => r.periodLocked as boolean,
    },
    columns: [
      { key: "invoiceId", label: "Invoice", cell: (r) => <span className="font-mono text-xs">{r.invoiceId as string}</span> },
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "patientName", label: "Recipient", cell: (r) => <>{r.patientName as string} <span className="text-[10px] text-muted-foreground">{r.supplyType as string}</span></> },
      { key: "placeOfSupply", label: "Place of supply", cell: (r) => r.placeOfSupply as string },
      { key: "desc", label: "Supply", cell: (r) => r.desc as string },
      { key: "code", label: "HSN/SAC", cell: codeCell },
      { key: "rate", label: "Rate", cell: rateCell },
      { key: "taxable", label: "Taxable", align: "right", sum: true, cell: (r) => money(r, "taxable") },
      TAX_COLS("cgst"), TAX_COLS("sgst"), TAX_COLS("igst"),
      { key: "gross", label: "Invoice value", align: "right", sum: true, cell: (r) => money(r, "gross") },
      {
        key: "gstr1Filed",
        label: "GSTR-1",
        cell: (r) => (
          <span className="inline-flex flex-wrap items-center gap-1">
            {reconStatusCell(r.gstr1Filed as boolean, r.gstr1Held as boolean, r.gstr1Period as string, "Filed", "Pending")}
            {(r.periodLocked as boolean) && <Badge variant="muted"><Lock className="size-3" /> Locked</Badge>}
          </span>
        ),
      },
    ],
    build: (d, f) => filterSales(d, f).map((r) => ({ ...r, _date: r.date, _amount: r.gross, _name: r.patientName })),
  },
  {
    key: "hsn",
    label: "HSN / SAC summary",
    blurb: "GSTR-1 Table 12 — outward supplies grouped by HSN/SAC code and rate.",
    totals: true,
    columns: [
      { key: "code", label: "HSN/SAC", cell: codeCell },
      { key: "codeDesc", label: "Description", cell: (r) => r.codeDesc as string },
      { key: "rate", label: "Rate", cell: rateCell },
      { key: "lines", label: "Lines", align: "right", cell: (r) => <span className="tabular-nums">{r.lines as number}</span> },
      { key: "taxable", label: "Taxable", align: "right", sum: true, cell: (r) => money(r, "taxable") },
      TAX_COLS("cgst"), TAX_COLS("sgst"), TAX_COLS("igst"), TAX_COLS("tax"),
    ],
    build: (d, f) => {
      const groups = new Map<string, Agg & { code: string; kind: TaxKind; codeDesc: string; rate: number; lines: number }>();
      for (const r of filterSales(d, f)) {
        const k = `${r.code}|${r.rate}`;
        if (!groups.has(k)) groups.set(k, { ...zero(), code: r.code, kind: r.kind, codeDesc: r.codeDesc, rate: r.rate, lines: 0 });
        const g = groups.get(k)!;
        addAgg(g, r); g.lines += 1;
      }
      return Array.from(groups.values()).map((g) => ({ ...g, ...roundAgg(g), _date: g.code, _amount: g.taxable, _name: g.code }));
    },
  },
  {
    key: "gstr2b",
    label: "GSTR-2B (ITC)",
    blurb: "Inward supplies from registered vendors — auto-drafted ITC. Out-of-Karnataka vendors charge IGST. Tag bills as claimed; MSME suppliers are flagged. Unclaimed ITC from earlier periods is carried forward into the selected period (marked “b/f”) until claimed.",
    totals: true,
    detail: {
      id: (r) => r.poId as string,
      done: (r) => r.itcClaimed as boolean,
      title: "Input-tax credit",
      doneLabel: "ITC claimed",
      pendingLabel: "Not claimed",
      doAction: "claimItc",
      undoAction: "unclaimItc",
      refLabel: "GSTR-3B ref (optional)",
      refExample: "3B-2026-06",
      periodSelect: true,
      returnName: "GSTR-3B",
      held: (r) => r.itcHeld as boolean,
      holdAction: "holdItc",
      unholdAction: "unholdItc",
    },
    columns: [
      { key: "billNo", label: "Bill no.", cell: (r) => <span className="font-mono text-xs">{r.billNo as string}</span> },
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "vendorName", label: "Supplier", cell: (r) => r.vendorName as string },
      { key: "msme", label: "MSME", cell: msmeCell },
      { key: "supplierState", label: "Source", cell: (r) => r.supplierState as string },
      { key: "itemName", label: "Item", cell: (r) => r.itemName as string },
      { key: "code", label: "HSN", cell: codeCell },
      { key: "rate", label: "Rate", cell: rateCell },
      { key: "nature", label: "Nature", cell: natureCell },
      { key: "taxable", label: "Taxable", align: "right", sum: true, cell: (r) => money(r, "taxable") },
      TAX_COLS("cgst"), TAX_COLS("sgst"), TAX_COLS("igst"),
      { key: "tax", label: "ITC", align: "right", sum: true, cell: (r) => money(r, "tax") },
      {
        key: "itcClaimed",
        label: "Status",
        cell: (r) => (
          <span className="inline-flex flex-wrap items-center gap-1">
            {reconStatusCell(r.itcClaimed as boolean, r.itcHeld as boolean, r.itcPeriod as string, "Claimed", "Pending")}
            {(r._carried as boolean) && <Badge variant="low">b/f {monthLabel(r.period as string)}</Badge>}
          </span>
        ),
      },
    ],
    // Carry forward: bills from earlier periods that are still unclaimed surface in
    // the selected period (marked _carried) so pending ITC isn't lost between months.
    build: (d, f) => {
      const within = filterPurchases(d, f);
      let rows: PurchaseRow[] = within;
      if (f.period !== "all" && f.recon !== "done") {
        const { from } = periodRange(f.period);
        const carried = d.purchases.filter(
          (r) =>
            !r.itcClaimed &&
            r.date.slice(0, 10) < from &&
            (f.rate === "all" || r.rate === Number(f.rate)) &&
            (f.nature === "all" || (f.nature === "inter" ? r.interState : !r.interState))
        );
        rows = [...within, ...carried.map((r) => ({ ...r, _carried: true }))];
      }
      return rows.map((r) => ({ ...r, _date: r.date, _amount: r.gross, _name: r.vendorName }));
    },
  },
  {
    key: "tdsPayable",
    label: "TDS payable (26Q)",
    blurb: "TDS we deduct on vendor payments. Knock off each liability by recording the deposit challan (CIN). MSME suppliers must be paid within 45 days.",
    totals: true,
    detail: {
      id: (r) => `tdsp:${r.poId as string}`,
      done: (r) => r.tdsDeposited as boolean,
      title: "TDS deposit",
      doneLabel: "Deposited",
      pendingLabel: "Payable",
      doAction: "depositTds",
      undoAction: "undepositTds",
      refLabel: "Challan no. (CIN)",
      refExample: "CIN0291226000789",
    },
    columns: [
      { key: "billNo", label: "Bill no.", cell: (r) => <span className="font-mono text-xs">{r.billNo as string}</span> },
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "vendorName", label: "Deductee", cell: (r) => r.vendorName as string },
      { key: "vendorPan", label: "PAN", cell: (r) => <span className="font-mono text-[11px]">{r.vendorPan as string}</span> },
      { key: "msme", label: "MSME", cell: msmeCell },
      { key: "tdsSection", label: "Section", cell: (r) => (r.tdsSection ? <Badge variant="default">{r.tdsSection as string}</Badge> : <span className="text-muted-foreground">—</span>) },
      { key: "taxable", label: "Base", align: "right", sum: true, cell: (r) => money(r, "taxable") },
      { key: "tdsRate", label: "Rate", align: "right", cell: (r) => (r.tdsSection ? `${r.tdsRate as number}%` : "—") },
      { key: "tds", label: "TDS", align: "right", sum: true, cell: (r) => money(r, "tds") },
      { key: "netPayable", label: "Net payable", align: "right", sum: true, cell: (r) => money(r, "netPayable") },
      { key: "tdsDeposited", label: "Challan", cell: (r) => (r.challanNo ? <span className="font-mono text-[11px] text-success">{r.challanNo as string}</span> : doneBadge(false, "", "Payable")) },
    ],
    build: (d, f) => filterBills(d, f).filter((r) => r.tdsSection).map((r) => ({ ...r, _date: r.date, _amount: r.tds, _name: r.vendorName })),
  },
  {
    key: "tdsReceivable",
    label: "TDS receivable (26AS)",
    blurb: "TDS withheld by B2B clients on our professional fees (sec. 194J). Knock off each by recording the Form 16A certificate as it is reflected in 26AS.",
    totals: true,
    detail: {
      id: (r) => `tdsr:${r.invoiceId as string}`,
      done: (r) => r.certified as boolean,
      title: "TDS credit",
      doneLabel: "Certified",
      pendingLabel: "Receivable",
      doAction: "certifyTds",
      undoAction: "uncertifyTds",
      refLabel: "Form 16A cert. no.",
      refExample: "16A/2026/0456",
    },
    columns: [
      { key: "invoiceId", label: "Invoice", cell: (r) => <span className="font-mono text-xs">{r.invoiceId as string}</span> },
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "clientName", label: "Client", cell: (r) => r.clientName as string },
      { key: "clientGstin", label: "GSTIN", cell: (r) => <span className="font-mono text-[11px]">{r.clientGstin as string}</span> },
      { key: "base", label: "Fee base", align: "right", sum: true, cell: (r) => money(r, "base") },
      { key: "rate", label: "Rate", align: "right", cell: (r) => `${r.rate as number}%` },
      { key: "tds", label: "TDS withheld", align: "right", sum: true, cell: (r) => money(r, "tds") },
      { key: "certified", label: "16A cert.", cell: (r) => (r.certNo ? <span className="font-mono text-[11px] text-success">{r.certNo as string}</span> : doneBadge(false, "", "Awaited")) },
    ],
    build: (d, f) =>
      d.salesTds
        .filter((r) => inPeriod(r.date, f.period))
        .filter((r) => f.recon === "all" || (f.recon === "done" ? r.certified : !r.certified))
        .map((r) => ({ ...r, _date: r.date, _amount: r.tds, _name: r.clientName })),
  },
  {
    key: "recon",
    label: "Books vs Return",
    blurb: "Reconciliation — books (everything billed/purchased) against what has been reported/claimed in returns. Any gap is the work-list; clear it from the GSTR-1 / GSTR-2B tabs.",
    summary: true,
    columns: [
      { key: "particulars", label: "Particulars", cell: (r) => <span className={cn((r._emphasis as boolean) && "font-semibold")}>{r.particulars as string}</span> },
      { key: "count", label: "Docs", align: "right", cell: (r) => <span className="tabular-nums">{r.count as number}</span> },
      { key: "taxable", label: "Taxable value", align: "right", cell: (r) => money(r, "taxable") },
      { key: "tax", label: "Tax", align: "right", cell: (r) => money(r, "tax") },
    ],
    build: (d, f) => buildRecon(d, f),
  },
  {
    key: "gstr3b",
    label: "GSTR-3B",
    blurb: "Monthly summary — net GST payable = output tax minus eligible ITC. Pick a tax period in the filters.",
    summary: true,
    columns: [
      { key: "particulars", label: "Particulars", cell: (r) => <span className={cn((r._emphasis as boolean) && "font-semibold")}>{r.particulars as string}</span> },
      { key: "taxable", label: "Taxable value", align: "right", cell: (r) => (r.taxable == null ? "—" : money(r, "taxable")) },
      { key: "igst", label: "IGST", align: "right", cell: (r) => money(r, "igst") },
      { key: "cgst", label: "CGST", align: "right", cell: (r) => money(r, "cgst") },
      { key: "sgst", label: "SGST", align: "right", cell: (r) => money(r, "sgst") },
      { key: "tax", label: "Total tax", align: "right", cell: (r) => money(r, "tax") },
    ],
    build: (d, f) => buildSummary(d, f, false),
  },
  {
    key: "gstr9",
    label: "GSTR-9",
    blurb: "Annual return — full-year consolidation of outward supplies, output tax, ITC and net liability. Pick a financial year in the filters.",
    summary: true,
    columns: [
      { key: "particulars", label: "Particulars", cell: (r) => <span className={cn((r._emphasis as boolean) && "font-semibold")}>{r.particulars as string}</span> },
      { key: "taxable", label: "Value", align: "right", cell: (r) => (r.taxable == null ? "—" : money(r, "taxable")) },
      { key: "igst", label: "IGST", align: "right", cell: (r) => money(r, "igst") },
      { key: "cgst", label: "CGST", align: "right", cell: (r) => money(r, "cgst") },
      { key: "sgst", label: "SGST", align: "right", cell: (r) => money(r, "sgst") },
      { key: "tax", label: "Total tax", align: "right", cell: (r) => money(r, "tax") },
    ],
    build: (d, f) => buildSummary(d, f, true),
  },
  {
    key: "creditLedger",
    label: "Electronic credit ledger",
    blurb: "Electronic credit ledger (input-tax credit) under three heads — IGST, CGST, SGST. ITC accrues here and is used to set off GSTR-3B liability (per the statutory order) before any cash is paid.",
    custom: "creditLedger",
    columns: [],
    build: () => [],
  },
  {
    key: "cashLedger",
    label: "Electronic cash ledger",
    blurb: "Electronic cash ledger held under three minor heads — IGST, CGST and SGST. Deposit funds via challan; the balance is debited when a GSTR-3B is filed with payment.",
    custom: "cashLedger",
    columns: [],
    build: () => [],
  },
  {
    key: "rcm",
    label: "RCM (reverse charge)",
    blurb: "Inward supplies liable to reverse charge (sec. 9(3)/9(4)) — e.g. goods transport, legal & security services. The clinic pays this GST in cash, then claims it back as ITC.",
    totals: true,
    columns: [
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "supplier", label: "Supplier", cell: (r) => r.supplier as string },
      { key: "desc", label: "Supply", cell: (r) => r.desc as string },
      { key: "code", label: "HSN/SAC", cell: (r) => <span className="font-mono text-xs">{r.code as string}</span> },
      { key: "rate", label: "Rate", cell: rateCell },
      { key: "nature", label: "Nature", cell: natureCell },
      { key: "taxable", label: "Taxable", align: "right", sum: true, cell: (r) => money(r, "taxable") },
      TAX_COLS("cgst"), TAX_COLS("sgst"), TAX_COLS("igst"),
      { key: "tax", label: "RCM tax", align: "right", sum: true, cell: (r) => money(r, "tax") },
    ],
    build: (d, f) => d.rcm.filter((r) => inPeriod(r.date, f.period)).filter((r) => f.rate === "all" || r.rate === Number(f.rate)).map((r) => ({ ...r, _date: r.date, _amount: r.tax, _name: r.supplier })),
  },
  {
    key: "itc04",
    label: "ITC-04 (job work)",
    blurb: "ITC-04 — goods sent to and received back from a job worker (the dental lab) on delivery challans. Tracks impressions/materials out and crowns/prosthetics in.",
    columns: [
      { key: "challanNo", label: "Challan", cell: (r) => <span className="font-mono text-xs">{r.challanNo as string}</span> },
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "jobWorker", label: "Job worker", cell: (r) => r.jobWorker as string },
      { key: "itemSent", label: "Sent", cell: (r) => <>{r.itemSent as string} <span className="text-muted-foreground">×{r.qtySent as number}</span></> },
      { key: "itemReceived", label: "Received", cell: (r) => ((r.status as string) === "received" ? <>{r.itemReceived as string} <span className="text-muted-foreground">×{r.qtyReceived as number}</span></> : <span className="text-muted-foreground">—</span>) },
      { key: "taxableValue", label: "Value", align: "right", cell: (r) => money(r, "taxableValue") },
      { key: "status", label: "Status", cell: (r) => ((r.status as string) === "received" ? <Badge variant="good">Received back</Badge> : <Badge variant="low">At job worker</Badge>) },
    ],
    build: (d, f) => d.jobwork.filter((r) => inPeriod(r.date, f.period)).map((r) => ({ ...r, _date: r.date, _amount: r.taxableValue, _name: r.jobWorker })),
  },
];

// Reports grouped for the two-level tab UI: GST returns, TDS, and the standalone
// Books-vs-Return reconciliation.
type GroupKey = "gst" | "tds" | "other" | "recon";
const REPORT_GROUPS: { key: GroupKey; label: string; reports: string[] }[] = [
  { key: "gst", label: "GST returns", reports: ["gstr1", "hsn", "gstr2b", "gstr3b", "gstr9", "creditLedger", "cashLedger"] },
  { key: "tds", label: "TDS", reports: ["tdsPayable", "tdsReceivable"] },
  { key: "other", label: "RCM & job-work", reports: ["rcm", "itc04"] },
  { key: "recon", label: "Books vs Return", reports: ["recon"] },
];
const groupOfReport = (key: string): GroupKey => REPORT_GROUPS.find((g) => g.reports.includes(key))?.key ?? "gst";

function buildSummary(d: Data, f: Filters, annual: boolean): Row[] {
  const sales = filterSales(d, { ...f, recon: "all" });
  const purchases = filterPurchases(d, { ...f, recon: "all" });
  const taxableSales = sales.filter((r) => r.rate > 0);
  const exemptSales = sales.filter((r) => r.rate === 0);

  const out = zero(); taxableSales.forEach((r) => addAgg(out, r));
  const exempt = zero(); exemptSales.forEach((r) => addAgg(exempt, r));
  const itc = zero(); purchases.forEach((r) => addAgg(itc, r));

  const rows: Row[] = [];
  const push = (particulars: string, a: Agg, opts: { emphasis?: boolean; taxableNull?: boolean } = {}) =>
    rows.push({ particulars, taxable: opts.taxableNull ? null : num(a.taxable), igst: num(a.igst), cgst: num(a.cgst), sgst: num(a.sgst), tax: num(a.tax), _emphasis: opts.emphasis });

  if (annual) {
    for (const rate of GST_RATES.filter((x) => x > 0)) {
      const g = zero();
      taxableSales.filter((r) => r.rate === rate).forEach((r) => addAgg(g, r));
      if (g.gross > 0) push(`Outward taxable @ ${rate}%`, g);
    }
    push("Exempt / nil-rated outward supplies", exempt);
    push("Total output tax", out, { emphasis: true });
    push("Input-tax credit availed", itc, { emphasis: true });
  } else {
    push("3.1(a) Outward taxable supplies", out);
    push("3.1(c) Exempt / nil-rated supplies", exempt);
    push("Total output tax", out, { emphasis: true });
    push("4. Eligible input-tax credit (ITC)", itc, { emphasis: true });
  }
  rows.push({ particulars: "Net GST payable / (credit)", taxable: null, igst: num(out.igst - itc.igst), cgst: num(out.cgst - itc.cgst), sgst: num(out.sgst - itc.sgst), tax: num(out.tax - itc.tax), _emphasis: true, _net: true });
  return rows;
}

// Books (all docs) vs Return (filed/claimed) with the gap highlighted.
function buildRecon(d: Data, f: Filters): Row[] {
  const sales = filterSales(d, { ...f, recon: "all" });
  const purchases = filterPurchases(d, { ...f, recon: "all" });
  // unique invoices / bills
  const invMap = new Map<string, { taxable: number; tax: number; filed: boolean; held: boolean }>();
  for (const r of sales) {
    const e = invMap.get(r.invoiceId) ?? { taxable: 0, tax: 0, filed: r.gstr1Filed, held: r.gstr1Held };
    e.taxable += r.taxable; e.tax += r.tax; e.filed = r.gstr1Filed; e.held = r.gstr1Held; invMap.set(r.invoiceId, e);
  }
  const billMap = new Map<string, { taxable: number; tax: number; claimed: boolean; held: boolean }>();
  for (const r of purchases) {
    const e = billMap.get(r.poId) ?? { taxable: 0, tax: 0, claimed: r.itcClaimed, held: r.itcHeld };
    e.taxable += r.taxable; e.tax += r.tax; e.claimed = r.itcClaimed; e.held = r.itcHeld; billMap.set(r.poId, e);
  }
  const inv = Array.from(invMap.values());
  const bill = Array.from(billMap.values());
  const agg = (xs: { taxable: number; tax: number }[]) => ({ count: xs.length, taxable: num(xs.reduce((s, x) => s + x.taxable, 0)), tax: num(xs.reduce((s, x) => s + x.tax, 0)) });
  const outBooks = agg(inv), outRet = agg(inv.filter((x) => x.filed)), outGap = agg(inv.filter((x) => !x.filed && !x.held));
  const inBooks = agg(bill), inRet = agg(bill.filter((x) => x.claimed)), inGap = agg(bill.filter((x) => !x.claimed && !x.held));
  const row = (particulars: string, a: { count: number; taxable: number; tax: number }, emphasis = false) => ({ particulars, ...a, _emphasis: emphasis, _gap: emphasis && a.count > 0 });
  return [
    row("Outward — as per books", outBooks),
    row("Outward — reported in GSTR-1", outRet),
    row("Outward — gap (unfiled)", outGap, true),
    row("Inward — as per books", inBooks),
    row("Inward — ITC claimed (GSTR-3B)", inRet),
    row("Inward — gap (ITC unclaimed)", inGap, true),
  ];
}

// ──────────────────────────────────────────────────────────────────────────
// component
// ──────────────────────────────────────────────────────────────────────────
export function TaxClient({ sales, purchases, bills, salesTds, rcm, jobwork, branches }: {
  sales: SalesRow[]; purchases: PurchaseRow[]; bills: PurchaseBill[]; salesTds: SalesTdsRow[];
  rcm: RcmRow[]; jobwork: JobWorkRow[]; branches: Branch[];
}) {
  const data: Data = { sales, purchases, bills, salesTds, rcm, jobwork, branches };
  const router = useRouter();

  const [groupKey, setGroupKey] = React.useState<GroupKey>("gst");
  const [reportKey, setReportKey] = React.useState(REPORTS[0].key);
  const [draft, setDraft] = React.useState<Filters>(DEFAULT_FILTERS);
  const [applied, setApplied] = React.useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = React.useState(true);
  const [cols, setCols] = React.useState<Record<string, string[]>>(() =>
    Object.fromEntries(REPORTS.map((r) => [r.key, r.columns.map((c) => c.key)]))
  );
  const [addOpen, setAddOpen] = React.useState(false);
  const [dragKey, setDragKey] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const tableRef = React.useRef<HTMLTableElement>(null);

  const periodOptions = React.useMemo(() => {
    const fys = new Set<string>(); const months = new Set<string>();
    [...sales, ...purchases, ...salesTds].forEach((r) => { fys.add(r.fy); months.add(r.period); });
    return { fys: Array.from(fys).sort().reverse(), months: Array.from(months).sort().reverse() };
  }, [sales, purchases, salesTds]);

  const report = REPORTS.find((r) => r.key === reportKey)!;
  const visibleKeys = cols[reportKey];
  const visibleCols = visibleKeys.map((k) => report.columns.find((c) => c.key === k)).filter(Boolean) as Column[];
  const hiddenCols = report.columns.filter((c) => !visibleKeys.includes(c.key));

  const builtRows = report.build(data, applied);
  const rows = report.summary ? builtRows : sortRows(builtRows, applied);

  const kpi = React.useMemo(() => {
    const s = filterSales(data, { ...applied, recon: "all" });
    const p = filterPurchases(data, { ...applied, recon: "all" });
    const billsF = filterBills(data, applied);
    const tdsRows = salesTds.filter((r) => inPeriod(r.date, applied.period));
    const sum = <T,>(xs: T[], f: (x: T) => number) => num(xs.reduce((a, x) => a + f(x), 0));

    const output = sum(s, (r) => r.tax);
    const input = sum(p, (r) => r.tax);
    const taxableTurnover = sum(s.filter((r) => r.rate > 0), (r) => r.taxable);
    const exemptTurnover = sum(s.filter((r) => r.rate === 0), (r) => r.taxable);

    const tdsPay = sum(billsF, (r) => r.tds);
    const tdsPayDeposited = sum(billsF.filter((r) => r.tdsDeposited), (r) => r.tds);
    const tdsRec = sum(tdsRows, (r) => r.tds);
    const tdsRecCertified = sum(tdsRows.filter((r) => r.certified), (r) => r.tds);

    // reconciliation gaps (unique docs not filed / claimed, excluding held)
    const outGap = s.filter((r) => !r.gstr1Filed && !r.gstr1Held);
    const inGap = p.filter((r) => !r.itcClaimed && !r.itcHeld);
    const outGapDocs = new Set(outGap.map((r) => r.invoiceId)).size;
    const inGapDocs = new Set(inGap.map((r) => r.poId)).size;

    return {
      output, input, net: num(output - input), taxableTurnover, exemptTurnover,
      tdsPay, tdsPayDeposited, tdsPayPending: num(tdsPay - tdsPayDeposited),
      tdsRec, tdsRecCertified, tdsRecPending: num(tdsRec - tdsRecCertified),
      outGapTaxable: sum(outGap, (r) => r.taxable), outGapDocs,
      inGapItc: sum(inGap, (r) => r.tax), inGapDocs,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, purchases, bills, salesTds, applied]);

  // KPI cards depend on the active group
  const kpiCards: { label: string; value: number; accent?: boolean; sub?: string }[] =
    groupKey === "tds"
      ? [
          { label: "TDS payable (26Q)", value: kpi.tdsPay },
          { label: "TDS payable — pending", value: kpi.tdsPayPending, accent: true },
          { label: "TDS deposited", value: kpi.tdsPayDeposited },
          { label: "TDS receivable (26AS)", value: kpi.tdsRec },
          { label: "TDS receivable — awaited", value: kpi.tdsRecPending, accent: true },
        ]
      : groupKey === "recon"
        ? [
            { label: "Outward gap (unfiled)", value: kpi.outGapTaxable, accent: true, sub: `${kpi.outGapDocs} invoice${kpi.outGapDocs === 1 ? "" : "s"}` },
            { label: "Inward ITC gap (unclaimed)", value: kpi.inGapItc, accent: true, sub: `${kpi.inGapDocs} bill${kpi.inGapDocs === 1 ? "" : "s"}` },
            { label: "TDS payable — pending", value: kpi.tdsPayPending },
            { label: "TDS receivable — awaited", value: kpi.tdsRecPending },
          ]
        : [
            { label: "Output GST (sales)", value: kpi.output },
            { label: "Input GST / ITC", value: kpi.input },
            { label: "Net GST payable", value: kpi.net, accent: true },
            { label: "Taxable turnover", value: kpi.taxableTurnover },
            { label: "Exempt turnover", value: kpi.exemptTurnover },
          ];

  // output liability & ITC per head for the selected period — drives 3B set-off
  const gstr3bHeads = React.useMemo(() => {
    const s = filterSales(data, { ...applied, recon: "all" });
    const p = filterPurchases(data, { ...applied, recon: "all" });
    const h = (rows: { igst: number; cgst: number; sgst: number }[], k: "igst" | "cgst" | "sgst") => num(rows.reduce((a, r) => a + r[k], 0));
    return {
      output: { igst: h(s, "igst"), cgst: h(s, "cgst"), sgst: h(s, "sgst") },
      itc: { igst: h(p, "igst"), cgst: h(p, "cgst"), sgst: h(p, "sgst") },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, purchases, applied]);

  // outward totals for the selected period — drives the GSTR-1 file & lock panel
  const gstr1Totals = React.useMemo(() => {
    const s = filterSales(data, { ...applied, recon: "all" });
    return { invoices: new Set(s.map((r) => r.invoiceId)).size, taxable: num(s.reduce((a, r) => a + r.taxable, 0)), tax: num(s.reduce((a, r) => a + r.tax, 0)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, applied]);

  const set = (patch: Partial<Filters>) => setDraft((p) => ({ ...p, ...patch }));

  function removeCol(key: string) { setCols((p) => ({ ...p, [reportKey]: p[reportKey].filter((k) => k !== key) })); }
  function addCol(key: string) { setCols((p) => ({ ...p, [reportKey]: [...p[reportKey], key] })); setAddOpen(false); }
  function moveCol(from: string, to: string) {
    if (from === to) return;
    setCols((p) => {
      const arr = [...p[reportKey]];
      const fi = arr.indexOf(from), ti = arr.indexOf(to);
      if (fi < 0 || ti < 0) return p;
      arr.splice(fi, 1); arr.splice(ti, 0, from);
      return { ...p, [reportKey]: arr };
    });
  }
  function toggleExpand(k: string) {
    setExpanded((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  }

  const totals: Record<string, number> | null = report.totals
    ? visibleCols.reduce((acc, c) => { if (c.sum) acc[c.key] = num(rows.reduce((s, r) => s + ((r[c.key] as number) ?? 0), 0)); return acc; }, {} as Record<string, number>)
    : null;

  const periodLabel = (value: string) =>
    value === "all" ? "All periods" : value.startsWith("fy:") ? `FY ${value.slice(3)}` : value.startsWith("m:") ? monthLabel(value.slice(2)) : value;

  const canExpand = !!report.detail;

  function exportPdf() {
    const win = window.open("", "_blank", "width=1024,height=720");
    if (!win || !tableRef.current) return;
    const parts: string[] = [`Period: ${periodLabel(applied.period)}`];
    if (applied.branch !== "all") { const b = branches.find((x) => x.id === applied.branch); parts.push(`GSTIN: ${b?.gstin ?? ""}`); }
    if (applied.rate !== "all") parts.push(`Rate: ${rateLabel(Number(applied.rate))}`);
    if (applied.nature !== "all") parts.push(`Nature: ${applied.nature === "inter" ? "Inter-state" : "Intra-state"}`);
    if (applied.supply !== "all") parts.push(`Supply: ${applied.supply}`);
    if (applied.recon !== "all") parts.push(`Status: ${applied.recon}`);
    const generated = new Date().toLocaleString("en-GB", { timeZone: "UTC" });
    win.document.write(`<!doctype html><html><head><title>Ivory Dental — ${report.label}</title>
      <style>
        *{box-sizing:border-box} body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#111;margin:32px}
        .brand{font-size:20px;font-weight:700;color:#0d9488}
        h2{margin:2px 0 4px;font-size:16px}
        .blurb{color:#555;font-size:12px;margin-bottom:8px;max-width:760px}
        .meta{color:#666;font-size:12px;margin-bottom:12px}
        .filters{font-size:12px;color:#444;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:8px 12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{text-align:left;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#666;border-bottom:2px solid #ddd;padding:8px}
        td{padding:7px 8px;border-bottom:1px solid #eee}
        td[align=right],th[align=right]{text-align:right}
        tfoot td{border-top:2px solid #ddd;font-weight:700}
        footer{margin-top:24px;font-size:11px;color:#999;text-align:center}
        @media print{body{margin:12mm}}
      </style></head><body>
      <div class="brand">🦷 Ivory Dental, Bengaluru — GSTIN ${branches[0]?.gstin ?? ""}</div>
      <h2>${report.label}</h2>
      <div class="blurb">${report.blurb}</div>
      <div class="meta">${rows.length} rows · Generated ${generated} UTC</div>
      <div class="filters">${parts.join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</div>
      ${tableRef.current.outerHTML}
      <footer>Ivory Dental Suite — GST working papers · figures modelled for demonstration</footer>
      </body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  const colCount = visibleCols.length + (canExpand ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* KPI strip — contextual to the active group */}
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", kpiCards.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-5")}>
        {kpiCards.map((c) => (
          <Kpi key={c.label} label={c.label} value={c.value} accent={c.accent} sub={c.sub} />
        ))}
      </div>

      {/* Group selector (GST returns · TDS · Books vs Return) */}
      <div className="flex flex-wrap items-center gap-2">
        {REPORT_GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => {
              setGroupKey(g.key);
              if (!g.reports.includes(reportKey)) setReportKey(g.reports[0]);
              setExpanded(new Set());
            }}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              g.key === groupKey ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-input bg-card text-muted-foreground hover:bg-accent"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Report sub-tabs within the active group (hidden when the group has one report) */}
      {(() => {
        const group = REPORT_GROUPS.find((g) => g.key === groupKey)!;
        const groupReports = group.reports.map((k) => REPORTS.find((r) => r.key === k)!).filter(Boolean);
        if (groupReports.length < 2) return null;
        return (
          <Card className="p-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="px-3 text-xs font-medium text-muted-foreground">{group.label}</span>
              {groupReports.map((r) => (
                <button key={r.key} onClick={() => { setReportKey(r.key); setExpanded(new Set()); }}
                  className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", r.key === reportKey ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent")}>
                  {r.label}
                </button>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Filters */}
      <Card className="overflow-hidden">
        <button onClick={() => setShowFilters((s) => !s)} className="flex w-full items-center gap-2 border-b px-5 py-3 text-sm font-medium hover:bg-accent/40">
          <SlidersHorizontal className="size-4" /> GST filters
          {showFilters ? <ChevronUp className="ml-auto size-4" /> : <ChevronDown className="ml-auto size-4" />}
        </button>
        {showFilters && (
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Return period">
                <Select value={draft.period} onChange={(e) => set({ period: e.target.value })} className="w-full">
                  <option value="all">All periods</option>
                  <optgroup label="Financial year">
                    {periodOptions.fys.map((fy) => <option key={fy} value={`fy:${fy}`}>FY {fy}</option>)}
                  </optgroup>
                  <optgroup label="Tax period (month)">
                    {periodOptions.months.map((m) => <option key={m} value={`m:${m}`}>{monthLabel(m)}</option>)}
                  </optgroup>
                </Select>
              </Field>
              <Field label="GSTIN / branch" onClear={draft.branch !== "all" ? () => set({ branch: "all" }) : undefined}>
                <Select value={draft.branch} onChange={(e) => set({ branch: e.target.value })} className="w-full">
                  <option value="all">All registrations (sales)</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.gstin}</option>)}
                </Select>
              </Field>
              <Field label="Reconciliation" onClear={draft.recon !== "all" ? () => set({ recon: "all" }) : undefined}>
                <Select value={draft.recon} onChange={(e) => set({ recon: e.target.value as Filters["recon"] })} className="w-full">
                  <option value="all">All documents</option>
                  <option value="pending">Pending only (unfiled / unclaimed)</option>
                  <option value="done">Reconciled only</option>
                </Select>
              </Field>
              <Field label="GST rate" onClear={draft.rate !== "all" ? () => set({ rate: "all" }) : undefined}>
                <Select value={draft.rate} onChange={(e) => set({ rate: e.target.value })} className="w-full">
                  <option value="all">All rates</option>
                  {GST_RATES.map((r) => <option key={r} value={String(r)}>{rateLabel(r)}</option>)}
                </Select>
              </Field>
              <Field label="Supply nature" onClear={draft.nature !== "all" ? () => set({ nature: "all" }) : undefined}>
                <Select value={draft.nature} onChange={(e) => set({ nature: e.target.value as Filters["nature"] })} className="w-full">
                  <option value="all">Intra & inter-state</option>
                  <option value="intra">Intra-state (CGST + SGST)</option>
                  <option value="inter">Inter-state (IGST)</option>
                </Select>
              </Field>
              <Field label="Supply type" onClear={draft.supply !== "all" ? () => set({ supply: "all" }) : undefined}>
                <Select value={draft.supply} onChange={(e) => set({ supply: e.target.value as Filters["supply"] })} className="w-full">
                  <option value="all">B2B & B2C</option>
                  <option value="B2B">B2B (registered)</option>
                  <option value="B2C">B2C (consumer)</option>
                </Select>
              </Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }}>Clear all</Button>
              <Button onClick={() => setApplied(draft)}>Apply filters</Button>
            </div>
          </div>
        )}
      </Card>

      <p className="px-1 text-xs text-muted-foreground">{report.blurb}</p>

      {report.custom === "cashLedger" && <ElectronicLedger onChanged={() => router.refresh()} />}
      {report.custom === "creditLedger" && <ElectronicCreditLedger />}

      {!report.custom && (
      <>
      {/* Column chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Columns:</span>
        {visibleCols.map((c) => (
          <span key={c.key} draggable onDragStart={() => setDragKey(c.key)} onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragKey) moveCol(dragKey, c.key); setDragKey(null); }} onDragEnd={() => setDragKey(null)}
            className={cn("inline-flex cursor-grab items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary active:cursor-grabbing", dragKey === c.key && "opacity-40")}>
            <GripVertical className="size-3 opacity-50" />{c.label}
            <button onClick={() => removeCol(c.key)} className="hover:text-danger" aria-label={`Remove ${c.label}`}><X className="size-3" /></button>
          </span>
        ))}
        {hiddenCols.length > 0 && (
          <div className="relative">
            <button onClick={() => setAddOpen((o) => !o)} className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent">
              <Plus className="size-3" /> Add
            </button>
            {addOpen && (
              <div className="absolute z-10 mt-1 w-48 rounded-lg border bg-card p-1 shadow-lg">
                {hiddenCols.map((c) => <button key={c.key} onClick={() => addCol(c.key)} className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-accent">{c.label}</button>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium">{report.label}</p>
            <span className="text-xs text-muted-foreground">{rows.length} rows · {periodLabel(applied.period)}</span>
          </div>
          <Button size="sm" variant="outline" onClick={exportPdf}><FileDown className="size-3.5" /> Export PDF</Button>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table ref={tableRef} className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                {canExpand && <th className="w-8 px-2 py-3" />}
                {visibleCols.map((c) => (
                  <th key={c.key} align={c.align === "right" ? "right" : undefined} className={cn("px-5 py-3 font-medium", c.align === "right" && "text-right")}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={colCount} className="px-5 py-12 text-center text-sm text-muted-foreground">No supplies match these filters</td></tr>
              )}
              {rows.map((r, i) => {
                const rowKey = (r.key as string) ?? String(i);
                const isOpen = canExpand && expanded.has(rowKey);
                return (
                  <React.Fragment key={rowKey}>
                    <tr className={cn("border-b transition-colors hover:bg-accent/50", (r._net as boolean) && "bg-primary/5", (r._gap as boolean) && "bg-warning/10", (r._emphasis as boolean) && "font-medium", isOpen && "bg-accent/40")}>
                      {canExpand && (
                        <td className="px-2 py-3 align-top">
                          <button onClick={() => toggleExpand(rowKey)} className="rounded p-0.5 hover:bg-accent" aria-label="Expand">
                            <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                          </button>
                        </td>
                      )}
                      {visibleCols.map((c) => (
                        <td key={c.key} align={c.align === "right" ? "right" : undefined} className={cn("px-5 py-3", c.align === "right" && "text-right tabular-nums")}>{c.cell(r)}</td>
                      ))}
                    </tr>
                    {isOpen && report.detail && (
                      <tr className="border-b bg-muted/20">
                        <td colSpan={colCount} className="px-5 py-4">
                          <ComplianceDetail
                            spec={report.detail}
                            row={r}
                            months={periodOptions.months}
                            defaultPeriod={applied.period.startsWith("m:") ? applied.period.slice(2) : periodOptions.months[0]}
                            onChanged={() => router.refresh()}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            {totals && rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 bg-muted/30 font-semibold">
                  {canExpand && <td className="px-2 py-3" />}
                  {visibleCols.map((c, idx) => (
                    <td key={c.key} align={c.align === "right" ? "right" : undefined} className={cn("px-5 py-3", c.align === "right" && "text-right tabular-nums")}>
                      {idx === 0 ? "Total" : c.sum ? <Money value={totals[c.key] ?? 0} /> : null}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {reportKey === "gstr1" && (
        <Gstr1Filing periodValue={applied.period} totals={gstr1Totals} onChanged={() => router.refresh()} />
      )}
      {reportKey === "gstr3b" && (
        <Gstr3bSettlement periodValue={applied.period} output={gstr3bHeads.output} itc={gstr3bHeads.itc} onChanged={() => router.refresh()} />
      )}
      </>
      )}
    </div>
  );
}

// Expandable compliance panel — audit trail + tag/knock-off actions, including
// the return period it's reported in and an include-or-hold selection.
function ComplianceDetail({ spec, row, months, defaultPeriod, onChanged }: {
  spec: DetailSpec; row: Row; months: string[]; defaultPeriod: string; onChanged: () => void;
}) {
  const id = spec.id(row);
  const done = spec.done(row);
  const held = spec.held?.(row) ?? false;
  const locked = spec.locked?.(row) ?? false;
  const [rec, setRec] = React.useState<{ trail?: { ts: string; event: string; ref?: string }[] } | null>(null);
  const [ref, setRef] = React.useState("");
  const [period, setPeriod] = React.useState(defaultPeriod || months[0] || "");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    fetch(`/api/tax/compliance?id=${encodeURIComponent(id)}`).then((r) => r.json()).then(setRec).catch(() => setRec(null));
  }, [id]);
  React.useEffect(() => { load(); }, [load]);

  async function run(action: string, opts: { withRef?: boolean; withPeriod?: boolean } = {}) {
    setBusy(true);
    await fetch("/api/tax/compliance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ref: opts.withRef ? ref : undefined, period: opts.withPeriod ? period : undefined }),
    });
    setBusy(false); setRef("");
    load(); onChanged();
  }

  const trail = rec?.trail ?? [];
  const ret = spec.returnName ?? "return";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{spec.title} · audit trail</p>
        <div className="flex items-center gap-2">
          {held ? <Badge variant="muted">Held — excluded</Badge> : doneBadge(done, spec.doneLabel, spec.pendingLabel)}
          <span className="font-mono text-xs text-muted-foreground">{id}</span>
        </div>
        {trail.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {trail.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <span className="text-foreground">{t.event}</span>
                  {t.ref ? <span className="font-mono text-muted-foreground"> · {t.ref}</span> : null}
                  <span className="block text-[10px] text-muted-foreground">{fmtDate(t.ts)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Action</p>
        {locked ? (
          <p className="text-xs text-muted-foreground">This return period is filed &amp; locked. Unlock it from the filing panel below the table to edit entries.</p>
        ) : done ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Marked {spec.doneLabel.toLowerCase()}. You can reverse this if it was tagged in error.</p>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(spec.undoAction)}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Reverse
            </Button>
          </div>
        ) : held ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Deliberately excluded from {ret}. Release the hold to make it eligible again.</p>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(spec.unholdAction!)}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Release hold
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {spec.periodSelect && (
              <label className="block">
                <span className="mb-1 block text-[11px] text-muted-foreground">Include in {ret} for period</span>
                <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full">
                  {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                </Select>
              </label>
            )}
            {spec.refLabel && (
              <label className="block">
                <span className="mb-1 block text-[11px] text-muted-foreground">{spec.refLabel}</span>
                <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder={spec.refExample} className="font-mono" />
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={busy || (!!spec.refLabel && !spec.periodSelect && !ref.trim())}
                onClick={() => run(spec.doAction, { withRef: !!spec.refLabel, withPeriod: !!spec.periodSelect })}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                {spec.periodSelect ? ` Include in ${ret}` : ` Mark ${spec.doneLabel.toLowerCase()}`}
              </Button>
              {spec.holdAction && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run(spec.holdAction!)}>
                  Hold / exclude
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// File & lock GSTR-1 for a period — freezes that month's outward entries.
function Gstr1Filing({ periodValue, totals, onChanged }: {
  periodValue: string; totals: { invoices: number; taxable: number; tax: number }; onChanged: () => void;
}) {
  const [filings, setFilings] = React.useState<Record<string, { period: string; date: string }> | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  const load = React.useCallback(() => {
    fetch("/api/tax/gstr1-filing").then((r) => r.json()).then(setFilings).catch(() => setFilings(null));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const isMonth = periodValue.startsWith("m:");
  const monthKey = isMonth ? periodValue.slice(2) : "";
  const locked = !!filings?.[monthKey];

  async function act(action: "file" | "unfile") {
    setBusy(true); setErr("");
    const res = await fetch("/api/tax/gstr1-filing", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, period: monthKey }),
    });
    const j = await res.json();
    setBusy(false);
    if (!j.ok) { setErr(j.error || "Failed"); return; }
    load(); onChanged();
  }

  return (
    <Card className="border-primary/30 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">File GSTR-1 {isMonth ? `· ${monthLabel(monthKey)}` : ""}</p>
        {locked && <Badge variant="good"><Lock className="size-3" /> Filed &amp; locked</Badge>}
      </div>
      {!isMonth ? (
        <p className="text-xs text-muted-foreground">Select a single tax month in the return-period filter to file and lock its GSTR-1 outward entries.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-6 text-sm">
            <div><span className="text-muted-foreground">Invoices: </span><span className="font-semibold tabular-nums">{totals.invoices}</span></div>
            <div><span className="text-muted-foreground">Taxable value: </span><span className="font-semibold tabular-nums"><Money value={totals.taxable} /></span></div>
            <div><span className="text-muted-foreground">Tax: </span><span className="font-semibold tabular-nums"><Money value={totals.tax} /></span></div>
          </div>
          {err && <p className="mt-2 text-[11px] text-danger">{err}</p>}
          <div className="mt-3 flex justify-end">
            {locked ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => act("unfile")}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Unlock / revise
              </Button>
            ) : (
              <Button size="sm" disabled={busy} onClick={() => act("file")}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />} File &amp; lock GSTR-1
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function Kpi({ label, value, accent, sub }: { label: string; value: number; accent?: boolean; sub?: string }) {
  return (
    <Card className={cn("p-4", accent && "border-primary/40 bg-primary/5")}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-bold tabular-nums", accent && "text-primary")}><Money value={value} /></p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function Field({ label, children, onClear }: { label: string; children: React.ReactNode; onClear?: () => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        {onClear && <button type="button" onClick={onClear} className="text-[10px] font-normal text-primary hover:underline">Clear</button>}
      </span>
      {children}
    </label>
  );
}

interface CashLedgerData {
  entries: CashEntry[];
  balances: { igst: number; cgst: number; sgst: number };
  total: number;
  filed: Record<string, { period: string; igst: number; cgst: number; sgst: number; date: string }>;
}

function useCashLedger() {
  const [data, setData] = React.useState<CashLedgerData | null>(null);
  const load = React.useCallback(() => {
    fetch("/api/tax/cash-ledger").then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);
  React.useEffect(() => { load(); }, [load]);
  return { data, load };
}

// Electronic cash ledger tab — 3 heads + deposit + running entries.
function ElectronicLedger({ onChanged }: { onChanged: () => void }) {
  const { currency } = usePrefs();
  const { data, load } = useCashLedger();
  const [dep, setDep] = React.useState({ igst: "", cgst: "", sgst: "", ref: "", date: "2026-06-04" });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  const toBase = (v: string) => (Number(v) || 0) / currency.rate;

  async function deposit() {
    setBusy(true); setErr("");
    const res = await fetch("/api/tax/cash-ledger", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deposit", igst: toBase(dep.igst), cgst: toBase(dep.cgst), sgst: toBase(dep.sgst), ref: dep.ref, date: dep.date }),
    });
    const j = await res.json();
    setBusy(false);
    if (!j.ok) { setErr(j.error || "Failed"); return; }
    setDep({ igst: "", cgst: "", sgst: "", ref: "", date: dep.date });
    load(); onChanged();
  }

  const b = data?.balances ?? { igst: 0, cgst: 0, sgst: 0 };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="IGST balance" value={b.igst} />
        <Kpi label="CGST balance" value={b.cgst} />
        <Kpi label="SGST balance" value={b.sgst} />
        <Kpi label="Total cash balance" value={data?.total ?? 0} accent />
      </div>

      <Card className="p-4">
        <p className="mb-3 text-sm font-medium">Deposit to cash ledger (challan)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(["igst", "cgst", "sgst"] as const).map((h) => (
            <Field key={h} label={`${h.toUpperCase()} (${currency.code})`}>
              <Input type="number" min="0" value={dep[h]} onChange={(e) => setDep((p) => ({ ...p, [h]: e.target.value }))} placeholder="0" />
            </Field>
          ))}
          <Field label="Date of deposit">
            <Input type="date" value={dep.date} onChange={(e) => setDep((p) => ({ ...p, date: e.target.value }))} />
          </Field>
          <Field label="Challan no. (CIN)">
            <Input value={dep.ref} onChange={(e) => setDep((p) => ({ ...p, ref: e.target.value }))} placeholder="CIN…" className="font-mono" />
          </Field>
        </div>
        {err && <p className="mt-2 text-[11px] text-danger">{err}</p>}
        <div className="mt-3 flex justify-end">
          <Button size="sm" disabled={busy} onClick={deposit}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add deposit</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3 text-sm font-medium">Ledger entries</div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 text-right font-medium">IGST</th>
                <th className="px-5 py-3 text-right font-medium">CGST</th>
                <th className="px-5 py-3 text-right font-medium">SGST</th>
              </tr>
            </thead>
            <tbody>
              {(data?.entries ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No entries yet</td></tr>
              )}
              {(data?.entries ?? []).map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="px-5 py-3">{fmtDate(e.date)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={e.kind === "deposit" ? "good" : "low"}>{e.kind === "deposit" ? "Deposit" : "3B settlement"}</Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{e.ref ?? "—"}</td>
                  {(["igst", "cgst", "sgst"] as const).map((h) => (
                    <td key={h} className={cn("px-5 py-3 text-right tabular-nums", e[h] < 0 && "text-danger")}>
                      {e[h] === 0 ? "—" : <Money value={e[h]} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Payment settlement at the end of GSTR-3B — pay the net liability per head from
// the cash ledger and lock the period.
const HEADS = ["igst", "cgst", "sgst"] as const;

function useCreditLedger() {
  const [data, setData] = React.useState<{ entries: CreditEntry[]; balances: HeadAmounts; total: number } | null>(null);
  const load = React.useCallback(() => {
    fetch("/api/tax/credit-ledger").then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);
  React.useEffect(() => { load(); }, [load]);
  return { data, load };
}

// File GSTR-3B: offset output liability with ITC (credit ledger) per the statutory
// set-off order, then pay the balance from the cash ledger, and lock the period.
function Gstr3bSettlement({ periodValue, output, itc, onChanged }: {
  periodValue: string; output: HeadAmounts; itc: HeadAmounts; onChanged: () => void;
}) {
  const { data: cash, load: loadCash } = useCashLedger();
  const { data: credit, load: loadCredit } = useCreditLedger();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  const isMonth = periodValue.startsWith("m:");
  const monthKey = isMonth ? periodValue.slice(2) : "";
  const filed = cash?.filed?.[monthKey];

  const creditBal = credit?.balances ?? { igst: 0, cgst: 0, sgst: 0 };
  const cashBal = cash?.balances ?? { igst: 0, cgst: 0, sgst: 0 };
  // available credit = current credit ledger balance + this period's ITC
  const avail: HeadAmounts = { igst: creditBal.igst + itc.igst, cgst: creditBal.cgst + itc.cgst, sgst: creditBal.sgst + itc.sgst };
  const so = computeSetOff(output, avail);
  const cashTax = so.cashPayable.igst + so.cashPayable.cgst + so.cashPayable.sgst;
  const lc = isMonth ? gstr3bLateCharges(monthKey, cashTax) : null;
  // cash needed includes late fee (cgst/sgst) + interest (igst)
  const cashNeed: HeadAmounts = {
    igst: num(so.cashPayable.igst + (lc?.interest ?? 0)),
    cgst: num(so.cashPayable.cgst + (lc?.lateFeeCgst ?? 0)),
    sgst: num(so.cashPayable.sgst + (lc?.lateFeeSgst ?? 0)),
  };
  const short = HEADS.some((h) => cashNeed[h] > (cashBal[h] ?? 0) + 1e-6);

  async function act(action: "file" | "reverse") {
    setBusy(true); setErr("");
    const res = await fetch("/api/tax/file-3b", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "file" ? { action, period: monthKey, liability: output, itc } : { action, period: monthKey }),
    });
    const j = await res.json();
    setBusy(false);
    if (!j.ok) { setErr(j.error || "Failed"); return; }
    loadCash(); loadCredit(); onChanged();
  }

  return (
    <Card className="border-primary/30 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">File GSTR-3B — set-off &amp; payment {isMonth ? `· ${monthLabel(monthKey)}` : ""}</p>
        {filed && <Badge variant="good"><Check className="size-3" /> Filed &amp; locked</Badge>}
      </div>

      {!isMonth ? (
        <p className="text-xs text-muted-foreground">Select a single tax month in the return-period filter to set off ITC and file the GSTR-3B.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 font-medium">Head</th>
                  <th className="py-2 text-right font-medium">Output liability</th>
                  <th className="py-2 text-right font-medium">ITC set off</th>
                  <th className="py-2 text-right font-medium">Cash payable</th>
                  <th className="py-2 text-right font-medium">Cash bal.</th>
                </tr>
              </thead>
              <tbody>
                {HEADS.map((h) => {
                  // credit applied to this liability head = sum across credit heads
                  const setOff = num((so.used.igst[h] ?? 0) + (so.used.cgst[h] ?? 0) + (so.used.sgst[h] ?? 0));
                  return (
                    <tr key={h} className="border-b last:border-0">
                      <td className="py-2 font-medium uppercase">{h}</td>
                      <td className="py-2 text-right tabular-nums"><Money value={output[h]} /></td>
                      <td className="py-2 text-right tabular-nums text-primary"><Money value={setOff} /></td>
                      <td className="py-2 text-right tabular-nums font-semibold"><Money value={so.cashPayable[h]} /></td>
                      <td className={cn("py-2 text-right tabular-nums", cashNeed[h] > (cashBal[h] ?? 0) + 1e-6 && "text-danger")}><Money value={cashBal[h] ?? 0} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
            <span>Available ITC credit: IGST <Money value={avail.igst} /> · CGST <Money value={avail.cgst} /> · SGST <Money value={avail.sgst} /></span>
            <span>Carried forward after set-off: IGST <Money value={so.creditLeft.igst} /> · CGST <Money value={so.creditLeft.cgst} /> · SGST <Money value={so.creditLeft.sgst} /></span>
          </div>
          {lc && lc.daysLate > 0 && (
            <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs">
              <p className="font-medium text-warning">Filed {lc.daysLate} day{lc.daysLate === 1 ? "" : "s"} late (due {fmtDate(lc.dueDate)})</p>
              <p className="mt-0.5 text-muted-foreground">
                Late fee <Money value={lc.lateFee} /> (CGST <Money value={lc.lateFeeCgst} /> + SGST <Money value={lc.lateFeeSgst} />) · Interest @18% p.a. <Money value={lc.interest} /> — added to cash payable.
              </p>
            </div>
          )}
          {err && <p className="mt-2 text-[11px] text-danger">{err}</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            {filed ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => act("reverse")}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Unlock / revise
              </Button>
            ) : (
              <Button size="sm" disabled={busy || short} onClick={() => act("file")}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Set off &amp; file GSTR-3B
              </Button>
            )}
          </div>
          {short && !filed && <p className="mt-1 text-right text-[11px] text-danger">Cash payable exceeds the cash-ledger balance — add a deposit in the Electronic cash ledger tab.</p>}
        </>
      )}
    </Card>
  );
}

// Electronic credit ledger tab — ITC balances per head + accrual/utilisation entries.
function ElectronicCreditLedger() {
  const { data } = useCreditLedger();
  const b = data?.balances ?? { igst: 0, cgst: 0, sgst: 0 };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="IGST credit" value={b.igst} />
        <Kpi label="CGST credit" value={b.cgst} />
        <Kpi label="SGST credit" value={b.sgst} />
        <Kpi label="Total ITC credit" value={data?.total ?? 0} accent />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3 text-sm font-medium">Credit ledger entries</div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 text-right font-medium">IGST</th>
                <th className="px-5 py-3 text-right font-medium">CGST</th>
                <th className="px-5 py-3 text-right font-medium">SGST</th>
              </tr>
            </thead>
            <tbody>
              {(data?.entries ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No entries yet</td></tr>
              )}
              {(data?.entries ?? []).map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="px-5 py-3">{fmtDate(e.date)}</td>
                  <td className="px-5 py-3"><Badge variant={e.kind === "accrual" ? "good" : "low"}>{e.kind === "accrual" ? "ITC accrued" : "Set off (3B)"}</Badge></td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{e.ref ?? "—"}</td>
                  {HEADS.map((h) => (
                    <td key={h} className={cn("px-5 py-3 text-right tabular-nums", e[h] < 0 && "text-danger")}>
                      {e[h] === 0 ? "—" : <Money value={e[h]} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
