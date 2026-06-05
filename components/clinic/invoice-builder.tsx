"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileDown, Save, Paperclip } from "lucide-react";
import { PROCEDURES, type InvoiceStatus, type PayMode } from "@/lib/clinic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { cn, formatDate } from "@/lib/utils";

interface PatientLite {
  id: string; name: string; emoji: string; phone: string; email: string; abhaId: string;
}
interface RxLite {
  id: string; patientId: string; date: string; providerName: string;
  items: { drug: string; dosage: string; frequency: string; duration: string; notes?: string }[];
}
interface LineItem { desc: string; amount: string }

const CLINIC = {
  name: "Ivory Dental, Bengaluru",
  address: "2nd Floor, Prestige Tower, 100ft Road, Indiranagar, Bengaluru 560038",
  contact: "+91 80 4123 9000 · accounts@ivorydental.in",
  gstin: "29ABCDE1234F1Z5",
  bank: "HDFC Bank · A/c 5012 3456 7890 · IFSC HDFC0001234 · UPI ivorydental@hdfcbank",
};

// ---- number to words ----
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoWords(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}
function threeWords(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return `${h ? ONES[h] + " Hundred" : ""}${h && rest ? " " : ""}${rest ? twoWords(rest) : ""}`.trim();
}
function indianWords(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${twoWords(crore)} Crore`);
  if (lakh) parts.push(`${twoWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoWords(thousand)} Thousand`);
  if (n) parts.push(threeWords(n));
  return parts.join(" ");
}
function intlWords(n: number): string {
  if (n === 0) return "Zero";
  const million = Math.floor(n / 1000000); n %= 1000000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const parts: string[] = [];
  if (million) parts.push(`${threeWords(million)} Million`);
  if (thousand) parts.push(`${threeWords(thousand)} Thousand`);
  if (n) parts.push(threeWords(n));
  return parts.join(" ");
}

export function InvoiceBuilder({
  patients,
  prescriptions,
  providers,
  nextNo,
}: {
  patients: PatientLite[];
  prescriptions: RxLite[];
  providers: { id: string; name: string }[];
  nextNo: string;
}) {
  const router = useRouter();
  const { currency } = usePrefs();

  const [patientId, setPatientId] = React.useState(patients[0]?.id ?? "");
  const [nameOverride, setNameOverride] = React.useState("");
  const [addressOverride, setAddressOverride] = React.useState("");
  const [gstinOverride, setGstinOverride] = React.useState("");
  const [invoiceNo, setInvoiceNo] = React.useState(nextNo);
  const [date, setDate] = React.useState("2026-06-04");
  const [signatory, setSignatory] = React.useState(providers[0]?.name ?? "");
  const [items, setItems] = React.useState<LineItem[]>([{ desc: "Consultation", amount: "15" }]);
  const [discountType, setDiscountType] = React.useState<"none" | "percent" | "amount">("none");
  const [discountValue, setDiscountValue] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [mode, setMode] = React.useState<PayMode>("upi");
  const [status, setStatus] = React.useState<InvoiceStatus>("paid");
  const [attachRx, setAttachRx] = React.useState(false);
  const [selectedRx, setSelectedRx] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

  const patient = patients.find((p) => p.id === patientId);
  const patientRx = prescriptions.filter((r) => r.patientId === patientId);
  const billName = nameOverride || patient?.name || "—";

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const discountAmt =
    discountType === "amount"
      ? parseFloat(discountValue) || 0
      : discountType === "percent"
      ? (subtotal * (parseFloat(discountValue) || 0)) / 100
      : 0;
  const total = Math.max(0, subtotal - discountAmt);

  const converted = Math.round(total * currency.rate);
  const words = `${currency.name}${currency.code === "USD" || currency.code === "GBP" || currency.code === "EUR" ? "s" : ""} ${
    currency.code === "INR" ? indianWords(converted) : intlWords(converted)
  } Only`;

  const fmtDate = formatDate;

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function toggleRx(id: string) {
    setSelectedRx((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function buildItemsPayload() {
    const out = items
      .filter((i) => i.desc.trim() && parseFloat(i.amount) > 0)
      .map((i) => ({ desc: i.desc.trim(), amount: parseFloat(i.amount) }));
    if (discountAmt > 0) out.push({ desc: `Discount${discountType === "percent" ? ` (${discountValue}%)` : ""}`, amount: -discountAmt });
    return out;
  }

  async function save() {
    setSaving(true);
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, items: buildItemsPayload(), status, mode }),
    });
    router.push("/billing");
    router.refresh();
  }

  function exportPdf() {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;
    const money = (usd: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: currency.code, maximumFractionDigits: 0 }).format(usd * currency.rate);

    const rows = items
      .filter((i) => i.desc.trim())
      .map((i) => `<tr><td>${escapeHtml(i.desc)}</td><td align="right">${money(parseFloat(i.amount) || 0)}</td></tr>`)
      .join("");
    const discountRow = discountAmt > 0 ? `<tr><td>Discount${discountType === "percent" ? ` (${discountValue}%)` : ""}</td><td align="right">- ${money(discountAmt)}</td></tr>` : "";

    const rxBlocks = attachRx
      ? prescriptions
          .filter((r) => selectedRx.includes(r.id))
          .map(
            (r) => `<div class="rx"><h3>Prescription · ${fmtDate(r.date)} · ${escapeHtml(r.providerName)}</h3>
              <table class="lines"><thead><tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
              <tbody>${r.items.map((it) => `<tr><td>${escapeHtml(it.drug)}</td><td>${escapeHtml(it.dosage)}</td><td>${escapeHtml(it.frequency)}</td><td>${escapeHtml(it.duration)}</td></tr>`).join("")}</tbody></table></div>`
          )
          .join("")
      : "";

    win.document.write(`<!doctype html><html><head><title>${invoiceNo}</title><style>
      *{box-sizing:border-box} body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#1a1a1a;margin:0;padding:40px}
      .head{display:flex;justify-content:space-between;border-bottom:3px solid #0d9488;padding-bottom:16px}
      .brand{font-size:22px;font-weight:800;color:#0d9488}
      .addr{font-size:11px;color:#555;max-width:280px;text-align:right;line-height:1.5}
      .row{display:flex;justify-content:space-between;margin-top:24px;gap:24px}
      .box{font-size:12px;line-height:1.6}
      .box .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#888}
      h2.sec{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#0d9488;margin:28px 0 8px}
      table.lines{width:100%;border-collapse:collapse;font-size:12px}
      table.lines th{text-align:left;background:#f4f4f5;border:1px solid #e4e4e7;padding:8px;font-size:10px;text-transform:uppercase;color:#666}
      table.lines td{border:1px solid #e9e9ec;padding:8px}
      table.lines td[align=right],table.lines th[align=right]{text-align:right}
      .totals{margin-top:12px;margin-left:auto;width:280px;font-size:13px}
      .totals .t{display:flex;justify-content:space-between;padding:4px 0}
      .totals .grand{border-top:2px solid #0d9488;margin-top:6px;padding-top:8px;font-weight:800;font-size:15px;color:#0d9488}
      .words{font-size:12px;font-style:italic;color:#444;margin-top:8px}
      .pay{font-size:11px;color:#555;margin-top:20px;line-height:1.6}
      .sign{margin-top:48px;text-align:right;font-size:12px}
      .rx{margin-top:24px;page-break-inside:avoid} .rx h3{font-size:12px;color:#0d9488;margin-bottom:6px}
      .ft{margin-top:40px;text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:12px}
      @media print{body{padding:14mm}}
    </style></head><body>
      <div class="head">
        <div><div class="brand">🦷 ${CLINIC.name}</div><div style="font-size:11px;color:#777;margin-top:4px">GSTIN ${CLINIC.gstin}</div></div>
        <div class="addr">${CLINIC.address}<br>${CLINIC.contact}</div>
      </div>
      <div class="row">
        <div class="box"><div class="lbl">Bill To</div><b>${escapeHtml(billName)}</b><br>${escapeHtml(addressOverride) || "&nbsp;"}<br>${escapeHtml(patient?.phone ?? "")}${gstinOverride ? `<br>GSTIN ${escapeHtml(gstinOverride)}` : ""}</div>
        <div class="box" style="text-align:right"><div class="lbl">Invoice</div><b>${escapeHtml(invoiceNo)}</b><br><span class="lbl">Date</span> ${fmtDate(date)}<br><span class="lbl">Status</span> ${status.toUpperCase()}</div>
      </div>
      <h2 class="sec">Description of Services</h2>
      <table class="lines"><thead><tr><th>Description</th><th align="right">Amount</th></tr></thead><tbody>${rows}${discountRow}</tbody></table>
      <div class="totals">
        <div class="t"><span>Subtotal</span><span>${money(subtotal)}</span></div>
        ${discountAmt > 0 ? `<div class="t"><span>Discount</span><span>- ${money(discountAmt)}</span></div>` : ""}
        <div class="t grand"><span>Total</span><span>${money(total)}</span></div>
      </div>
      <div class="words">Amount in words: ${words}</div>
      <div class="pay"><b>Payment details</b><br>Mode: ${mode.toUpperCase()}<br>${CLINIC.bank}${notes ? `<br><br><b>Notes:</b> ${escapeHtml(notes)}` : ""}</div>
      <div class="sign">_______________________<br><b>${escapeHtml(signatory)}</b><br>For ${CLINIC.name}</div>
      ${rxBlocks ? `<h2 class="sec">Attached Prescriptions</h2>${rxBlocks}` : ""}
      <div class="ft">Ivory Dental Suite — computer-generated invoice</div>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* LEFT — live preview */}
      <div className="order-2 lg:order-1">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live preview</span>
          <span className="text-xs text-muted-foreground">{currency.code}</span>
        </div>
        <Card className="overflow-hidden p-0">
          <div className="space-y-5 bg-white p-6 text-[13px] text-zinc-800">
            {/* letterhead */}
            <div className="flex justify-between border-b-2 border-primary pb-3">
              <div>
                <p className="text-lg font-extrabold text-primary">🦷 {CLINIC.name}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">GSTIN {CLINIC.gstin}</p>
              </div>
              <p className="max-w-[200px] text-right text-[10px] leading-relaxed text-zinc-500">
                {CLINIC.address}
                <br />
                {CLINIC.contact}
              </p>
            </div>

            <div className="flex justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Bill To</p>
                <p className="font-semibold">{billName}</p>
                {addressOverride && <p className="text-xs text-zinc-600">{addressOverride}</p>}
                <p className="text-xs text-zinc-600">{patient?.phone}</p>
                {gstinOverride && <p className="text-xs text-zinc-600">GSTIN {gstinOverride}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Invoice</p>
                <p className="font-semibold">{invoiceNo}</p>
                <p className="text-xs text-zinc-600">{fmtDate(date)}</p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                    status === "paid" ? "bg-green-100 text-green-700" : status === "due" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {status}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">Description of Services</p>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-left text-[10px] uppercase text-zinc-500">
                    <th className="border border-zinc-200 px-2 py-1.5 font-medium">Description</th>
                    <th className="border border-zinc-200 px-2 py-1.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter((i) => i.desc.trim()).length === 0 && (
                    <tr>
                      <td className="border border-zinc-200 px-2 py-1.5 text-zinc-400" colSpan={2}>
                        No line items yet
                      </td>
                    </tr>
                  )}
                  {items
                    .filter((i) => i.desc.trim())
                    .map((i, idx) => (
                      <tr key={idx}>
                        <td className="border border-zinc-200 px-2 py-1.5">{i.desc}</td>
                        <td className="border border-zinc-200 px-2 py-1.5 text-right tabular-nums">
                          <Money value={parseFloat(i.amount) || 0} />
                        </td>
                      </tr>
                    ))}
                  {discountAmt > 0 && (
                    <tr>
                      <td className="border border-zinc-200 px-2 py-1.5 text-zinc-600">
                        Discount{discountType === "percent" ? ` (${discountValue}%)` : ""}
                      </td>
                      <td className="border border-zinc-200 px-2 py-1.5 text-right tabular-nums text-zinc-600">
                        - <Money value={discountAmt} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-56 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-zinc-500">Subtotal</span>
                <span className="tabular-nums">
                  <Money value={subtotal} />
                </span>
              </div>
              <div className="mt-1 flex justify-between border-t-2 border-primary pt-1.5 text-sm font-extrabold text-primary">
                <span>Total</span>
                <span className="tabular-nums">
                  <Money value={total} />
                </span>
              </div>
            </div>
            <p className="text-[11px] italic text-zinc-500">Amount in words: {words}</p>

            <div className="text-[10px] leading-relaxed text-zinc-500">
              <p className="font-semibold text-zinc-700">Payment details</p>
              <p>Mode: {mode.toUpperCase()}</p>
              <p>{CLINIC.bank}</p>
              {notes && <p className="mt-2 text-zinc-600">Notes: {notes}</p>}
            </div>

            <div className="pt-6 text-right text-xs">
              <p className="text-zinc-400">_______________________</p>
              <p className="font-semibold">{signatory}</p>
              <p className="text-zinc-500">For {CLINIC.name}</p>
            </div>

            {attachRx && selectedRx.length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary">Attached Prescriptions</p>
                {prescriptions
                  .filter((r) => selectedRx.includes(r.id))
                  .map((r) => (
                    <div key={r.id} className="mb-3">
                      <p className="text-[11px] font-medium text-zinc-600">
                        {fmtDate(r.date)} · {r.providerName}
                      </p>
                      <ul className="ml-4 list-disc text-[11px] text-zinc-600">
                        {r.items.map((it, idx) => (
                          <li key={idx}>
                            {it.drug} — {it.dosage}, {it.frequency}, {it.duration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* RIGHT — editor */}
      <div className="order-1 space-y-4 lg:order-2">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={save} disabled={saving || !items.some((i) => i.desc.trim() && parseFloat(i.amount) > 0)}>
            <Save className="size-4" /> {saving ? "Saving…" : "Save invoice"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={exportPdf}>
            <FileDown className="size-4" /> Export PDF
          </Button>
        </div>

        <Card className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Patient">
              <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full">
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Invoice no.">
              <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Signatory">
              <Select value={signatory} onChange={(e) => setSignatory(e.target.value)} className="w-full">
                {providers.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Bill-to overrides (optional)</p>
            <div className="space-y-2">
              <Input placeholder={`Name (default: ${patient?.name ?? ""})`} value={nameOverride} onChange={(e) => setNameOverride(e.target.value)} />
              <Input placeholder="Billing address" value={addressOverride} onChange={(e) => setAddressOverride(e.target.value)} />
              <Input placeholder="GSTIN" value={gstinOverride} onChange={(e) => setGstinOverride(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Line items</p>
            <button
              onClick={() => setItems((p) => [...p, { desc: "", amount: "" }])}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="size-3.5" /> Add line
            </button>
          </div>
          <datalist id="proc-opts">
            {PROCEDURES.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input list="proc-opts" placeholder="Procedure / description" value={it.desc} onChange={(e) => updateItem(i, { desc: e.target.value })} className="flex-1" />
                <Input type="number" min="0" placeholder="0" value={it.amount} onChange={(e) => updateItem(i, { amount: e.target.value })} className="w-24" />
                {items.length > 1 && (
                  <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="rounded-md p-1.5 text-muted-foreground hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
            <Field label="Discount type">
              <Select value={discountType} onChange={(e) => setDiscountType(e.target.value as typeof discountType)} className="w-full">
                <option value="none">None</option>
                <option value="amount">Flat amount</option>
                <option value="percent">Percent</option>
              </Select>
            </Field>
            <Field label="Discount value">
              <Input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} disabled={discountType === "none"} placeholder={discountType === "percent" ? "%" : "amount"} />
            </Field>
            <div className="flex items-end">
              <div className="w-full rounded-lg border bg-muted/30 px-3 py-2 text-right">
                <span className="text-[10px] uppercase text-muted-foreground">Total </span>
                <span className="font-bold tabular-nums">
                  <Money value={total} />
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Payment mode">
              <Select value={mode} onChange={(e) => setMode(e.target.value as PayMode)} className="w-full">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="online">Online</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)} className="w-full">
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="due">Due</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes (optional)">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment instructions, remarks…" />
          </Field>
        </Card>

        <Card className="space-y-3 p-5">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={attachRx} onChange={(e) => setAttachRx(e.target.checked)} className="size-4 accent-[hsl(var(--primary))]" />
            <Paperclip className="size-4" /> Attach prescription to PDF
          </label>
          {attachRx && (
            <div className="space-y-1.5">
              {patientRx.length === 0 ? (
                <p className="text-xs text-muted-foreground">This patient has no prescriptions on file.</p>
              ) : (
                patientRx.map((r) => (
                  <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-accent/50">
                    <input type="checkbox" checked={selectedRx.includes(r.id)} onChange={() => toggleRx(r.id)} className="size-4 accent-[hsl(var(--primary))]" />
                    <span className="flex-1">
                      {fmtDate(r.date)} · {r.providerName}
                      <span className="ml-1 text-xs text-muted-foreground">({r.items.length} drugs)</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
