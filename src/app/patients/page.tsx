import { listPatients, ageFromDob } from "@/lib/clinic";
import { PageHeader } from "@/components/shell/page-header";
import { PatientsClient } from "@/components/clinic/patients-client";

export default function PatientsPage() {
  const patients = listPatients().map((p) => ({ ...p, age: ageFromDob(p.dob) }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Patients" subtitle={`${patients.length} registered patients`} />
      <PatientsClient initial={patients} />
    </div>
  );
}
