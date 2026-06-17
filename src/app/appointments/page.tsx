import { listAppointments, listPatients, providers, listTimeOff, TODAY_LABEL, TODAY_ISO } from "@/lib/clinic";
import { PageHeader } from "@/components/shell/page-header";
import { AppointmentsClient } from "@/components/clinic/appointments-client";

export default function AppointmentsPage() {
  const appts = listAppointments();
  const patients = listPatients().map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Appointments" subtitle={`${TODAY_LABEL} · calendar, board & live queue`} />
      <AppointmentsClient
        initial={appts}
        patients={patients}
        providers={providers}
        today={TODAY_ISO}
        timeOff={listTimeOff()}
      />
    </div>
  );
}
