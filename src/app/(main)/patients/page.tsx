import { listPatients } from "@/lib/db/patients";
import { ageFromDob } from "@/lib/clinic";
import { PageHeader } from "@/components/shell/page-header";
import { PatientsClient } from "@/components/clinic/patients-client";

export default async function PatientsPage() {
  const raw = await listPatients();
  const patients = raw.map((p) => ({
    ...p,
    id: String(p.id),
    age: ageFromDob(p.dob),
    toothFindings: {} as Record<number, string>,
    treatmentPlan: [],
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Patients" subtitle={`${patients.length} registered patients`} />
      <PatientsClient initial={patients} />
    </div>
  );
}
