import { notFound } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { getPurchaseOrder, getVendor, type POStatus } from "@/lib/vendors";
import { classifyGoods, splitInclusive, stateCodeFromGstin, stateName, isInterState } from "@/lib/gst";
import { Money } from "@/components/ui/money";
import { PrintBar } from "@/components/clinic/print-bar";
import { formatDate as fmtDate } from "@/lib/utils";

const STATUS_LABEL: Record<POStatus, string> = {
  issued: "Issued",
  partial: "Partially received",
  received: "Received",
  invoiced: "Invoiced",
  paid: "Paid",
  closed: "Closed",
};

export default function PODocumentPage({ params }: { params: { id: string } }) {
  const po = getPurchaseOrder(params.id);
  if (!po) notFound();
  const vendor = getVendor(po.vendorId);

  // GST breakup — unit prices are tax-inclusive. Out-of-Karnataka vendors charge
  // IGST; local (29…) vendors charge CGST + SGST.
  const supplierStateCode = stateCodeFromGstin(vendor?.gstin);
  const inter = isInterState(supplierStateCode);
  const lines = po.items.map((l) => {
    const cls = classifyGoods(l.itemName);
    return { ...l, cls, gst: splitInclusive(l.unitPrice * l.qty, cls.rate, inter) };
  });
  const taxableTotal = lines.reduce((s, l) => s + l.gst.taxable, 0);
  const cgstTotal = lines.reduce((s, l) => s + l.gst.cgst, 0);
  const sgstTotal = lines.reduce((s, l) => s + l.gst.sgst, 0);
  const igstTotal = lines.reduce((s, l) => s + l.gst.igst, 0);
  // TDS is deducted on the taxable base (excludes GST) when the vendor is flagged.
  const tdsAmt = vendor?.tds ? Math.round(taxableTotal * (vendor.tds.rate / 100) * 100) / 100 : 0;
  const netPayable = Math.round((po.total - tdsAmt) * 100) / 100;

  return (
    <div className="print:bg-white">
      <PrintBar backHref="/vendors?tab=procurement" label="PO" />

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
            <p className="text-lg font-bold tracking-tight">PURCHASE ORDER</p>
            <p className="font-mono text-sm">{po.id}</p>
            {po.manual && <p className="text-[11px] font-medium text-gray-500">Direct purchase</p>}
          </div>
        </div>

        {/* meta */}
        <div className="grid grid-cols-2 gap-6 py-5 text-sm">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Vendor</p>
            <p className="font-semibold">{vendor?.name ?? po.vendorId}</p>
            {vendor && (
              <>
                <p className="text-gray-600">{vendor.contact}</p>
                <p className="text-gray-600">{vendor.email}</p>
                <p className="text-gray-600">{vendor.phone}</p>
                <p className="text-gray-600">GSTIN {vendor.gstin || "—"}{vendor.pan ? ` · PAN ${vendor.pan}` : ""}</p>
                {vendor.msme && (
                  <p className="text-gray-600">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">MSME</span>
                    {vendor.udyam ? ` Udyam ${vendor.udyam}` : ""}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="text-right">
            <Meta label="PO date" value={fmtDate(po.date)} />
            <Meta label="Reference" value={po.rfqId ?? "Direct"} />
            <Meta label="Status" value={STATUS_LABEL[po.status]} />
            <Meta label="Subject" value={po.rfqTitle} />
            <Meta label="Place of supply" value={`${stateName(supplierStateCode)} → Karnataka`} />
          </div>
        </div>

        {/* line items */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-gray-300 text-left text-[11px] uppercase tracking-wide text-gray-500">
              <th className="py-2">#</th>
              <th className="py-2">Item</th>
              <th className="py-2">HSN</th>
              <th className="py-2 text-right">GST</th>
              <th className="py-2 text-right">Ordered</th>
              <th className="py-2 text-right">Received</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const rec = po.received[l.itemName] ?? 0;
              return (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2">{l.itemName}</td>
                  <td className="py-2 font-mono text-xs">{l.cls.code}</td>
                  <td className="py-2 text-right tabular-nums text-gray-600">{l.cls.rate}%</td>
                  <td className="py-2 text-right tabular-nums">{l.qty}</td>
                  <td className="py-2 text-right tabular-nums">
                    {po.receipts.length ? (
                      <span className={rec === l.qty ? "" : rec > l.qty ? "text-amber-600" : "text-red-600"}>
                        {rec}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    <Money value={l.unitPrice} />
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">
                    <Money value={l.unitPrice * l.qty} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="text-gray-600">
              <td colSpan={6} className="pt-3 text-right text-xs">Taxable value</td>
              <td colSpan={2} className="pt-3 text-right text-sm tabular-nums"><Money value={taxableTotal} /></td>
            </tr>
            {inter ? (
              <tr className="text-gray-600">
                <td colSpan={6} className="text-right text-xs">IGST</td>
                <td colSpan={2} className="text-right text-sm tabular-nums"><Money value={igstTotal} /></td>
              </tr>
            ) : (
              <>
                <tr className="text-gray-600">
                  <td colSpan={6} className="text-right text-xs">CGST</td>
                  <td colSpan={2} className="text-right text-sm tabular-nums"><Money value={cgstTotal} /></td>
                </tr>
                <tr className="text-gray-600">
                  <td colSpan={6} className="text-right text-xs">SGST</td>
                  <td colSpan={2} className="text-right text-sm tabular-nums"><Money value={sgstTotal} /></td>
                </tr>
              </>
            )}
            <tr>
              <td colSpan={6} className="py-3 text-right text-sm font-semibold">Total (incl. GST)</td>
              <td colSpan={2} className="py-3 text-right text-base font-bold tabular-nums">
                <Money value={po.total} />
              </td>
            </tr>
            {tdsAmt > 0 && (
              <>
                <tr className="text-gray-600">
                  <td colSpan={6} className="text-right text-xs">Less: TDS u/s {vendor!.tds!.section} @ {vendor!.tds!.rate}%</td>
                  <td colSpan={2} className="text-right text-sm tabular-nums">– <Money value={tdsAmt} /></td>
                </tr>
                <tr>
                  <td colSpan={6} className="py-2 text-right text-sm font-semibold">Net payable to vendor</td>
                  <td colSpan={2} className="py-2 text-right text-base font-bold tabular-nums"><Money value={netPayable} /></td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        {/* remittance / bank details */}
        {vendor?.bank && (vendor.bank.accountNumber || vendor.bank.ifsc) && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Remit to (bank)</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-gray-700 sm:grid-cols-4">
              {vendor.bank.accountName && <p><span className="text-gray-400">A/c name:</span> {vendor.bank.accountName}</p>}
              {vendor.bank.accountNumber && <p><span className="text-gray-400">A/c no:</span> {vendor.bank.accountNumber}</p>}
              {vendor.bank.ifsc && <p><span className="text-gray-400">IFSC:</span> {vendor.bank.ifsc}</p>}
              {(vendor.bank.bankName || vendor.bank.branch) && (
                <p><span className="text-gray-400">Bank:</span> {[vendor.bank.bankName, vendor.bank.branch].filter(Boolean).join(", ")}</p>
              )}
            </div>
          </div>
        )}

        {/* receipts / invoice / payment */}
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 text-sm sm:grid-cols-3">
          <Box title="Goods receipt">
            {po.receipts.length === 0 ? (
              <p className="text-gray-400">Not yet received</p>
            ) : (
              po.receipts.map((g) => {
                const recd = g.lines.reduce((s, l) => s + l.qty, 0);
                const freeUnits = g.lines.reduce((s, l) => s + (l.free ?? 0), 0);
                return (
                  <p key={g.id} className="text-gray-600">
                    {fmtDate(g.date)} · {recd} units{freeUnits ? ` + ${freeUnits} free` : ""}
                    {g.note ? ` — ${g.note}` : ""}
                  </p>
                );
              })
            )}
          </Box>
          <Box title="Vendor invoice">
            {po.invoice ? (
              <>
                <p className="font-medium">{po.invoice.number}</p>
                <p className="text-gray-600">{fmtDate(po.invoice.date)}</p>
                <p className="text-gray-600">
                  <Money value={po.invoice.amount} />
                </p>
              </>
            ) : (
              <p className="text-gray-400">Awaited</p>
            )}
          </Box>
          <Box title="Payment">
            {po.payment ? (
              <>
                <p className="font-medium capitalize">{po.payment.mode}</p>
                <p className="text-gray-600">{fmtDate(po.payment.date)}</p>
                {po.payment.reference && <p className="text-gray-600">Ref {po.payment.reference}</p>}
                <p className="text-gray-600">
                  <Money value={po.payment.amount} />
                </p>
              </>
            ) : (
              <p className="text-gray-400">Pending</p>
            )}
          </Box>
        </div>

        {po.closedReason && (
          <p className="mt-4 text-xs text-gray-500">PO closed — {po.closedReason}</p>
        )}

        <p className="mt-8 border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
          This is a system-generated purchase order from Ivory Dental Suite.
        </p>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p className="mb-1 text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}: </span>
      <span className="font-medium">{value}</span>
    </p>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      {children}
    </div>
  );
}
