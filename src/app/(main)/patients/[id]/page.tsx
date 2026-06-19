import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPatient } from "@/lib/db/patients";
import { prescriptionsFor, visitsFor, invoicesFor, providers, ageFromDob } from "@/lib/clinic";
import { PatientChart } from "@/components/clinic/patient-chart";

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { tab?: string };
}) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const raw = await getPatient(id);
  if (!raw) notFound();

  // Map Prisma patient to the shape PatientChart expects
  const patient = {
    ...raw,
    id: String(raw.id),
    toothFindings: {} as Record<number, string>,
    treatmentPlan: [],
    xrays: [],
  };

  return (
    <div className="animate-fade-in">
      <Link
        href="/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All patients
      </Link>
      <PatientChart
        patient={patient as any}
        prescriptions={prescriptionsFor(patient.id)}
        visits={visitsFor(patient.id)}
        invoices={invoicesFor(patient.id)}
        providers={providers}
        age={ageFromDob(patient.dob)}
        initialTab={searchParams?.tab}
      />
    </div>
  );
}
