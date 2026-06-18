import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Stethoscope, Pill, Receipt, Printer } from "lucide-react";
import {
  getVisitById,
  getPatient,
  providerById,
  prescriptionsFor,
  invoicesFor,
} from "@/lib/clinic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { formatDate } from "@/lib/utils";

const sameDay = (a: string, b: string) => a.slice(0, 10) === b.slice(0, 10);

export default function VisitDetailPage({ params }: { params: { id: string; visitId: string } }) {
  const visit = getVisitById(params.visitId);
  if (!visit || visit.patientId !== params.id) notFound();
  const patient = getPatient(visit.patientId);
  const doctor = providerById(visit.providerId);

  // work recorded around this encounter (same calendar day)
  const rxs = prescriptionsFor(visit.patientId).filter((r) => sameDay(r.date, visit.date));
  const invoices = invoicesFor(visit.patientId).filter((i) => sameDay(i.date, visit.date));

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <Link
        href={`/patients/${params.id}?tab=Journey`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to patient journey
      </Link>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Stethoscope className="size-5" />
            </span>
            <div>
              <CardTitle>{visit.complaint}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDate(visit.date)} · {doctor?.name ?? "—"}
                {doctor ? ` · ${doctor.specialty}` : ""}
              </p>
            </div>
          </div>
          <Badge variant="muted">{patient?.name}</Badge>
        </CardHeader>
        <CardContent>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clinical notes / work done
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">{visit.notes || "—"}</p>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="size-4 text-primary" /> Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rxs.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">None this visit</p>
            ) : (
              rxs.map((rx) => (
                <Link
                  key={rx.id}
                  href={`/patients/${params.id}/rx/${rx.id}`}
                  target="_blank"
                  className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm hover:bg-accent/50"
                >
                  <span className="min-w-0 flex-1 truncate">{rx.items.map((i) => i.drug).join(", ")}</span>
                  <Printer className="size-3.5 shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4 text-success" /> Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoices.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">None this visit</p>
            ) : (
              invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/billing/${inv.id}`}
                  target="_blank"
                  className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm hover:bg-accent/50"
                >
                  <span className="font-mono text-xs">{inv.id}</span>
                  <span className="flex items-center gap-2">
                    <Money value={inv.total} />
                    <Badge variant={inv.status === "paid" ? "good" : inv.status === "due" ? "out" : "low"}>
                      {inv.status}
                    </Badge>
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
