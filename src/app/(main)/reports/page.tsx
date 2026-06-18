import { listInvoices, listAppointments, listPatients, providers, getPatient, providerById } from "@/lib/clinic";
import { getTaxData } from "@/lib/tax-data";
import { PageHeader } from "@/components/shell/page-header";
import { ReportsHub } from "@/components/clinic/reports-hub";

export default function ReportsPage({ searchParams }: { searchParams?: { view?: string } }) {
  const initialView = searchParams?.view === "tax" ? "tax" : "operational";
  const invoices = listInvoices().map((i) => {
    const p = getPatient(i.patientId);
    return {
      id: i.id,
      date: i.date,
      patientId: i.patientId,
      patientName: p?.name ?? "—",
      total: i.total,
      status: i.status,
      mode: i.mode,
    };
  });

  const appointments = listAppointments().map((a) => {
    const p = getPatient(a.patientId);
    const dr = providerById(a.providerId);
    return {
      id: a.id,
      date: a.start,
      patientId: a.patientId,
      patientName: p?.name ?? "—",
      providerId: a.providerId,
      providerName: dr?.name ?? "—",
      type: a.type,
      status: a.status,
      reason: a.reason,
      chair: a.chair,
    };
  });

  const patients = listPatients().map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    balance: p.balance,
    lastVisit: p.lastVisit,
    gender: p.gender,
    conditions: p.conditions,
  }));

  const treatments = listPatients().flatMap((p) =>
    p.treatmentPlan.map((t) => ({
      id: t.id,
      patientId: p.id,
      patientName: p.name,
      tooth: t.tooth,
      procedure: t.procedure,
      phase: t.phase,
      estimate: t.estimate,
      status: t.status,
    }))
  );

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports" subtitle="Operational reporting & tax returns (GST · TDS)" />
      <ReportsHub
        initialView={initialView}
        operational={{
          invoices,
          appointments,
          patients,
          treatments,
          providers: providers.map((p) => ({ id: p.id, name: p.name })),
        }}
        tax={getTaxData()}
      />
    </div>
  );
}
