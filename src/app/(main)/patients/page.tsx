import { listPatients } from "@/lib/db/patients";
import { ageFromDob, type ToothStatus } from "@/lib/clinic";
import { PageHeader } from "@/components/shell/page-header";
import { PatientsClient } from "@/components/clinic/patients-client";

export default async function PatientsPage() {
  const raw = await listPatients();
  const patients = raw.map((p) => ({
    ...p,
    id: String(p.id),
    age: ageFromDob(p.dob),
    toothFindings: {} as Record<number, ToothStatus>,
    treatmentPlan: [],
    anniversary: p.anniversary ?? undefined,
    abhaId: p.abhaId ?? undefined,
    gstin: p.gstin ?? undefined,
    locationId: p.locationId ?? undefined,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Patients" subtitle={`${patients.length} registered patients`} />
      <PatientsClient initial={patients} />
    </div>
  );
}
