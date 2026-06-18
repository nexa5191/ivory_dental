import {
  listAppointments,
  listInvoices,
  listPatients,
  providers,
  upcomingCelebrations,
  TODAY_LABEL,
  TODAY_ISO,
} from "@/lib/clinic";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  const appts = listAppointments();
  const invoices = listInvoices();
  const patients = listPatients().map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    balance: p.balance,
  }));
  const celebrations = upcomingCelebrations(45);

  return (
    <DashboardClient
      appts={appts}
      invoices={invoices}
      patients={patients}
      providers={providers.map((p) => ({ id: p.id, name: p.name }))}
      celebrations={celebrations}
      todayLabel={TODAY_LABEL}
      todayIso={TODAY_ISO}
    />
  );
}
