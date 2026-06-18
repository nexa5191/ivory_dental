import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getPatient,
  prescriptionsFor,
  visitsFor,
  invoicesFor,
  providers,
  ageFromDob,
} from "@/lib/clinic";

export default function PatientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { tab?: string };
}) {
  const patient = getPatient(params.id);
  if (!patient) notFound();

  return (
    <div className="animate-fade-in">
      <Link
        href="/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All patients
      </Link>
      <PatientChartLoader id={params.id} tab={searchParams?.tab} />
    </div>
  );
}

// Server data → client chart
import { PatientChart } from "@/components/clinic/patient-chart";

function PatientChartLoader({ id, tab }: { id: string; tab?: string }) {
  const patient = getPatient(id)!;
  return (
    <PatientChart
      patient={patient}
      prescriptions={prescriptionsFor(id)}
      visits={visitsFor(id)}
      invoices={invoicesFor(id)}
      providers={providers}
      age={ageFromDob(patient.dob)}
      initialTab={tab}
    />
  );
}
