import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  listPatients,
  prescriptionsFor,
  providerById,
  providers,
  listInvoices,
  PROCEDURES,
} from "@/lib/clinic";
import { InvoiceBuilder } from "@/components/clinic/invoice-builder";

export default function NewInvoicePage() {
  const patients = listPatients().map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    phone: p.phone,
    email: p.email,
    abhaId: p.abhaId ?? "",
  }));

  const prescriptions = listPatients().flatMap((p) =>
    prescriptionsFor(p.id).map((rx) => ({
      id: rx.id,
      patientId: p.id,
      date: rx.date,
      providerName: providerById(rx.providerId)?.name ?? "—",
      items: rx.items,
    }))
  );

  const nextNo = `INV-${2045 + listInvoices().length}`;

  return (
    <div className="animate-fade-in">
      <Link
        href="/billing"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to billing
      </Link>
      <InvoiceBuilder
        patients={patients}
        prescriptions={prescriptions}
        providers={providers.map((p) => ({ id: p.id, name: p.name }))}
        nextNo={nextNo}
      />
    </div>
  );
}
