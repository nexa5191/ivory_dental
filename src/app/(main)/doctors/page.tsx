import { providers, listAppointments, listPatients, prescriptionsFor, listTimeOff } from "@/lib/clinic";
import { PageHeader } from "@/components/shell/page-header";
import { DoctorsClient, type DoctorRow } from "@/components/clinic/doctors-client";

export default function DoctorsPage() {
  const appts = listAppointments();
  const patients = listPatients();
  const allRx = patients.flatMap((p) => prescriptionsFor(p.id));
  const timeOff = listTimeOff();

  const doctors: DoctorRow[] = providers.map((d) => {
    const dAppts = appts.filter((a) => a.providerId === d.id);
    const completed = dAppts.filter((a) => a.status === "completed").length;
    const seen = new Set(dAppts.map((a) => a.patientId));
    const rx = allRx.filter((r) => r.providerId === d.id).length;
    return {
      ...d,
      appts: dAppts.length,
      completed,
      patients: seen.size,
      rx,
      leaves: timeOff.filter((t) => t.providerId === d.id),
    };
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Doctors" subtitle="Clinical team — specialties & today's load" />
      <DoctorsClient doctors={doctors} />
    </div>
  );
}
