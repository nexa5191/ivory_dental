import Link from "next/link";
import { ArrowLeft, Check, Minus, X, Sparkles, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Cell = "yes" | "partial" | "no";

interface Row {
  feature: string;
  detail: string;
  ivory: Cell;
  practo: Cell;
  clinicia: Cell;
  dentee: Cell;
}

// Competitor assessments are indicative, based on each product's positioning.
const ROWS: Row[] = [
  { feature: "Appointments + live queue", detail: "Day/week/month, board, calendar, reschedule, status filter", ivory: "yes", practo: "yes", clinicia: "yes", dentee: "yes" },
  { feature: "Doctor leave / calendar block", detail: "Block dates so no booking lands on a day off", ivory: "yes", practo: "yes", clinicia: "partial", dentee: "partial" },
  { feature: "Interactive dental chart", detail: "FDI ↔ UR/UL toggle, per-tooth findings", ivory: "yes", practo: "partial", clinicia: "yes", dentee: "yes" },
  { feature: "Per-tooth work → invoice", detail: "Log fee per tooth, bill it, hide once billed", ivory: "yes", practo: "partial", clinicia: "yes", dentee: "partial" },
  { feature: "Prescriptions + print", detail: "Advice bullets, editable date/doctor/sign, Rx PDF", ivory: "yes", practo: "yes", clinicia: "yes", dentee: "yes" },
  { feature: "Billing & invoices", detail: "Itemised, payments, printable invoice + Rx in one doc", ivory: "yes", practo: "yes", clinicia: "yes", dentee: "yes" },
  { feature: "GST returns + e-ledgers", detail: "GSTR-1/2B/3B/9, HSN/SAC, TDS 26Q/26AS, ITC set-off, cash & credit ledgers", ivory: "yes", practo: "partial", clinicia: "partial", dentee: "no" },
  { feature: "X-ray / image attachments", detail: "Upload radiographs & photos to the chart", ivory: "yes", practo: "yes", clinicia: "yes", dentee: "partial" },
  { feature: "Patient journey ledger", detail: "Unified timeline, click any event to trace", ivory: "yes", practo: "partial", clinicia: "partial", dentee: "partial" },
  { feature: "Vendor master + procurement", detail: "RFQ → quotes → compare → split award → PO lifecycle", ivory: "yes", practo: "no", clinicia: "no", dentee: "no" },
  { feature: "Vendor self-service portal", detail: "Unique link per vendor to bid, register & track POs", ivory: "yes", practo: "no", clinicia: "no", dentee: "no" },
  { feature: "Inventory + consumption + GRN", detail: "Consume/write-off, GRN auto-adds stock", ivory: "yes", practo: "partial", clinicia: "partial", dentee: "no" },
  { feature: "Cloud document hub", detail: "Microsoft / Google / Dropbox / S3, universal search", ivory: "yes", practo: "no", clinicia: "no", dentee: "no" },
  { feature: "Multi-branch", detail: "Switch branch or view all; per-branch figures", ivory: "yes", practo: "yes", clinicia: "yes", dentee: "partial" },
  { feature: "Dashboards + FY reporting", detail: "This/last month, financial year, custom range", ivory: "yes", practo: "yes", clinicia: "partial", dentee: "partial" },
  { feature: "White-label theming + fonts", detail: "Live colour studio, font picker, nav layout", ivory: "yes", practo: "no", clinicia: "no", dentee: "no" },
  { feature: "Multi-currency", detail: "Enter in local currency, ₹ Lakh/Cr formatting", ivory: "yes", practo: "partial", clinicia: "partial", dentee: "no" },
];

const VALUE = [
  { title: "All-in-one", body: "Clinical, billing, inventory and procurement in one app — no stitching tools together." },
  { title: "Procurement built-in", body: "RFQ→quote→split-award→PO→GRN→payment, with a vendor portal. Rare in clinic software." },
  { title: "White-label ready", body: "Re-colour, re-font and re-layout live — ship it under any clinic's brand in minutes." },
  { title: "Traceable by design", body: "Every visit, Rx, invoice and tooth-work is linked in one journey you can click through." },
  { title: "India-first", body: "₹ Lakh/Cr formatting, GSTIN, ABHA labels, financial-year reporting out of the box." },
];

function Mark({ v }: { v: Cell }) {
  if (v === "yes") return <Check className="mx-auto size-4 text-success" />;
  if (v === "partial") return <Minus className="mx-auto size-4 text-warning" />;
  return <X className="mx-auto size-4 text-muted-foreground/40" />;
}

export default function ComparePage() {
  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Settings
      </Link>

      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-8">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Stethoscope className="size-3.5 text-primary" /> Ivory Dental Suite — MVP
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Features &amp; value add</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          How this MVP compares with leading dental-clinic platforms — Practo, Clinicia and Dentee.
          Competitor marks are indicative, based on each product&apos;s public positioning.
        </p>
      </div>

      {/* value-add cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE.map((v) => (
          <Card key={v.title} className="p-5">
            <div className="mb-1.5 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="font-semibold">{v.title}</p>
            </div>
            <p className="text-sm text-muted-foreground">{v.body}</p>
          </Card>
        ))}
      </div>

      {/* comparison matrix */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Feature comparison</CardTitle>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="size-3.5 text-success" /> Full</span>
            <span className="flex items-center gap-1"><Minus className="size-3.5 text-warning" /> Partial / add-on</span>
            <span className="flex items-center gap-1"><X className="size-3.5 text-muted-foreground/40" /> Not available</span>
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 text-left font-medium">Capability</th>
                  <th className="px-3 py-3 text-center font-medium">
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Stethoscope className="size-3.5" /> Ivory
                    </span>
                  </th>
                  <th className="px-3 py-3 text-center font-medium">Practo</th>
                  <th className="px-3 py-3 text-center font-medium">Clinicia</th>
                  <th className="px-3 py-3 text-center font-medium">Dentee</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.feature} className="border-b last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.feature}</p>
                      <p className="text-xs text-muted-foreground">{r.detail}</p>
                    </td>
                    <td className="bg-primary/[0.04] px-3 py-3"><Mark v={r.ivory} /></td>
                    <td className="px-3 py-3"><Mark v={r.practo} /></td>
                    <td className="px-3 py-3"><Mark v={r.clinicia} /></td>
                    <td className="px-3 py-3"><Mark v={r.dentee} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">MVP scope</p>
            <p className="text-sm text-muted-foreground">
              Fully clickable demo · mock in-memory data · multi-branch · INR-first.
            </p>
          </div>
          <Badge variant="good">{ROWS.filter((r) => r.ivory === "yes").length} features live</Badge>
        </div>
      </Card>
    </div>
  );
}
