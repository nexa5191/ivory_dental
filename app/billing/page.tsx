import { listInvoices, listPatients, getPatient, PROCEDURES, TODAY_LABEL } from "@/lib/clinic";
import { PageHeader } from "@/components/shell/page-header";
import { BillingClient } from "@/components/clinic/billing-client";

export default function BillingPage() {
  const invoices = listInvoices().map((inv) => {
    const p = getPatient(inv.patientId);
    return { ...inv, patientName: p?.name ?? "—", patientEmoji: p?.emoji ?? "🧑" };
  });
  const patients = listPatients().map((p) => ({ id: p.id, name: p.name, emoji: p.emoji }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Billing" subtitle={`Invoices & payments · ${TODAY_LABEL}`} />
      <BillingClient invoices={invoices} patients={patients} procedures={PROCEDURES} />
    </div>
  );
}
