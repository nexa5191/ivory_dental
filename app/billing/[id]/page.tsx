import { notFound } from "next/navigation";
import { Stethoscope, Pill } from "lucide-react";
import { getInvoiceById, getPatient, getPrescriptionById, providerById } from "@/lib/clinic";
import { classifyService, splitInclusive } from "@/lib/gst";
import { Money } from "@/components/ui/money";
import { PrintBar } from "@/components/clinic/print-bar";
import { formatDate } from "@/lib/utils";

export default function InvoiceDocumentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { rx?: string };
}) {
  const inv = getInvoiceById(params.id);
  if (!inv) notFound();
  const patient = getPatient(inv.patientId);
  // Section 2: a prescription linked to this invoice (or passed via ?rx=)
  const rx = getPrescriptionById(inv.rxId ?? searchParams?.rx ?? "");
  const rxDoctor = rx ? providerById(rx.providerId) : null;

  const paid = (inv.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const received = paid > 0 ? Math.min(paid, inv.total) : inv.status === "paid" ? inv.total : inv.status === "partial" ? inv.total / 2 : 0;
  const due = Math.max(0, inv.total - received);

  // GST breakup — line amounts are tax-inclusive; patients are intra-state B2C
  // (CGST + SGST). Healthcare lines are exempt (0%), so tax is 0 for those.
  const lines = inv.items.map((l) => {
    const cls = classifyService(l.desc);
    return { ...l, cls, gst: splitInclusive(l.amount, cls.rate, false) };
  });
  const taxableTotal = lines.reduce((s, l) => s + l.gst.taxable, 0);
  const cgstTotal = lines.reduce((s, l) => s + l.gst.cgst, 0);
  const sgstTotal = lines.reduce((s, l) => s + l.gst.sgst, 0);
  const taxTotal = cgstTotal + sgstTotal;

  return (
    <div className="print:bg-white">
      <PrintBar backHref="/billing" label={rx ? "documents" : "invoice"} />

      {rx && (
        <p className="mx-auto mb-2 max-w-3xl text-[11px] font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
          Section 1 · Tax invoice
        </p>
      )}

      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 text-black shadow-sm print:border-0 print:shadow-none">
        {/* letterhead */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#1f6feb] text-white">
              <Stethoscope className="size-6" />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">Ivory Dental Suite</p>
              <p className="text-xs text-gray-500">
                2nd Floor, Prestige Tower, 100ft Road, Indiranagar, Bengaluru 560038
              </p>
              <p className="text-xs text-gray-500">GSTIN 29ABCDE1234F1Z5 · accounts@ivorydental.in</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tracking-tight">TAX INVOICE</p>
            <p className="font-mono text-sm">{inv.id}</p>
            <span
              className={
                "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                (inv.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : inv.status === "partial"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700")
              }
            >
              {inv.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* meta */}
        <div className="grid grid-cols-2 gap-6 py-5 text-sm">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Bill to</p>
            <p className="font-semibold">{patient?.name ?? inv.patientId}</p>
            {patient && (
              <>
                <p className="text-gray-600">{patient.phone}</p>
                <p className="text-gray-600">{patient.email}</p>
                {patient.abhaId && <p className="text-gray-600">ABHA {patient.abhaId}</p>}
              </>
            )}
          </div>
          <div className="text-right">
            <p className="mb-1 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Date: </span>
              <span className="font-medium">{formatDate(inv.date)}</span>
            </p>
            <p className="mb-1 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Mode: </span>
              <span className="font-medium uppercase">{inv.mode}</span>
            </p>
          </div>
        </div>

        {/* line items */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-gray-300 text-left text-[11px] uppercase tracking-wide text-gray-500">
              <th className="py-2">#</th>
              <th className="py-2">Description</th>
              <th className="py-2">HSN/SAC</th>
              <th className="py-2 text-right">GST</th>
              <th className="py-2 text-right">Taxable</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-400">{i + 1}</td>
                <td className="py-2">{l.desc}</td>
                <td className="py-2">
                  <span className="font-mono text-xs">{l.cls.code}</span>
                  <span className="ml-1 text-[9px] uppercase text-gray-400">{l.cls.kind}</span>
                </td>
                <td className="py-2 text-right tabular-nums text-gray-600">
                  {l.cls.rate === 0 ? "Exempt" : `${l.cls.rate}%`}
                </td>
                <td className="py-2 text-right tabular-nums text-gray-600">
                  <Money value={l.gst.taxable} />
                </td>
                <td className="py-2 text-right tabular-nums">
                  <Money value={l.amount} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-gray-600">
              <td colSpan={4} className="pt-3 text-right text-xs">Taxable value</td>
              <td colSpan={2} className="pt-3 text-right text-sm tabular-nums"><Money value={taxableTotal} /></td>
            </tr>
            {taxTotal > 0 && (
              <>
                <tr className="text-gray-600">
                  <td colSpan={4} className="text-right text-xs">CGST</td>
                  <td colSpan={2} className="text-right text-sm tabular-nums"><Money value={cgstTotal} /></td>
                </tr>
                <tr className="text-gray-600">
                  <td colSpan={4} className="text-right text-xs">SGST</td>
                  <td colSpan={2} className="text-right text-sm tabular-nums"><Money value={sgstTotal} /></td>
                </tr>
              </>
            )}
            <tr>
              <td colSpan={4} className="py-3 text-right text-sm font-semibold">Total</td>
              <td colSpan={2} className="py-3 text-right text-base font-bold tabular-nums"><Money value={inv.total} /></td>
            </tr>
            <tr className="text-gray-600">
              <td colSpan={4} className="pb-1 text-right text-xs">Received</td>
              <td colSpan={2} className="pb-1 text-right text-sm tabular-nums"><Money value={received} /></td>
            </tr>
            {due > 0 && (
              <tr className="text-red-600">
                <td colSpan={4} className="text-right text-xs font-semibold">Balance due</td>
                <td colSpan={2} className="text-right text-sm font-bold tabular-nums"><Money value={due} /></td>
              </tr>
            )}
          </tfoot>
        </table>

        {taxTotal === 0 && (
          <p className="mt-3 text-[11px] text-gray-500">
            All supplies on this invoice are exempt healthcare services (Notification 12/2017-CT, entry 74) — no GST charged.
          </p>
        )}

        {/* payments */}
        {(inv.payments ?? []).length > 0 && (
          <div className="mt-5 border-t border-gray-200 pt-4 text-sm">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Payments</p>
            {(inv.payments ?? []).map((p, i) => (
              <p key={i} className="text-gray-600">
                {formatDate(p.date)} · {p.mode.toUpperCase()}
                {p.reference ? ` · ${p.reference}` : ""} — <Money value={p.amount} />
              </p>
            ))}
          </div>
        )}

        <p className="mt-8 border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
          Thank you for choosing Ivory Dental Suite. This is a system-generated invoice.
        </p>
      </div>

      {/* ── Section 2 · Prescription (prints on a new page) ── */}
      {rx && (
        <div className="print:break-before-page">
          <p className="mx-auto mb-2 mt-8 max-w-3xl text-[11px] font-semibold uppercase tracking-wider text-muted-foreground print:mt-0 print:text-gray-500">
            Section 2 · Prescription
          </p>
          <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 text-black shadow-sm print:border-0 print:shadow-none">
            <div className="flex items-start justify-between border-b border-gray-200 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-[#1f6feb] text-white">
                  <Stethoscope className="size-6" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-tight">Ivory Dental Suite</p>
                  <p className="text-xs text-gray-500">100ft Road, Indiranagar, Bengaluru 560038</p>
                </div>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1.5 text-lg font-bold tracking-tight">
                  <Pill className="size-5 text-[#1f6feb]" /> PRESCRIPTION
                </p>
                <p className="text-sm text-gray-600">{formatDate(rx.date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-5 text-sm">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Patient</p>
                <p className="font-semibold">{rx.patientName ?? patient?.name ?? rx.patientId}</p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Prescribed by</p>
                <p className="font-semibold">{rx.prescriberName ?? rxDoctor?.name ?? "—"}</p>
                {rxDoctor && <p className="text-gray-600">{rxDoctor.specialty} · {rxDoctor.reg}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-serif text-3xl font-bold text-gray-400">℞</span>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-left text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="py-2">Medication</th>
                    <th className="py-2">Dosage</th>
                    <th className="py-2">Frequency</th>
                    <th className="py-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {rx.items.map((it, i) => (
                    <tr key={i} className="border-b border-gray-100 align-top">
                      <td className="py-2.5 font-medium">
                        {it.drug}
                        {it.notes ? <span className="block text-xs font-normal text-gray-500">{it.notes}</span> : null}
                      </td>
                      <td className="py-2.5 text-gray-700">{it.dosage}</td>
                      <td className="py-2.5 text-gray-700">{it.frequency}</td>
                      <td className="py-2.5 text-gray-700">{it.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rx.advice && rx.advice.length > 0 && (
              <div className="mt-5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Advice</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {rx.advice.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10 flex items-end justify-end">
              <div className="text-center">
                <div className="h-10 w-48 border-b border-gray-400" />
                <p className="mt-1 text-xs text-gray-500">{rx.signName ?? rx.prescriberName ?? rxDoctor?.name ?? "Signature"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
