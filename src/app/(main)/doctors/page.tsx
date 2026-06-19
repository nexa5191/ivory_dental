import { listProviders } from "@/lib/db/providers";
import { PageHeader } from "@/components/shell/page-header";
import { DoctorsClient, type DoctorRow } from "@/components/clinic/doctors-client";

export default async function DoctorsPage() {
  const providers = await listProviders();

  const doctors: DoctorRow[] = providers.map((d) => ({
    ...d,
    id: String(d.id),
    appts: 0,
    completed: 0,
    patients: 0,
    rx: 0,
    leaves: [],
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Doctors" subtitle="Clinical team — specialties & today's load" />
      <DoctorsClient doctors={doctors} />
    </div>
  );
}
