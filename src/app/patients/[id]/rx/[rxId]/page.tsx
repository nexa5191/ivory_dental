import { notFound } from "next/navigation";
import { Stethoscope, Pill } from "lucide-react";
import { getPrescriptionById, getPatient, providerById, ageFromDob } from "@/lib/clinic";
import { PrintBar } from "@/components/clinic/print-bar";
import { formatDate } from "@/lib/utils";

export default function PrescriptionDocPage({ params }: { params: { id: string; rxId: string } }) {
  const rx = getPrescriptionById(params.rxId);
  if (!rx || rx.patientId !== params.id) notFound();
  const patient = getPatient(rx.patientId);
  const doctor = providerById(rx.providerId);
  const patientLabel = rx.patientName ?? patient?.name ?? rx.patientId;
  const prescriber = rx.prescriberName ?? doctor?.name ?? "—";
  const signLabel = rx.signName ?? prescriber;

  return (
    <div className="print:bg-white">
      <PrintBar backHref={`/patients/${params.id}`} label="prescription" />

      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 text-black shadow-sm print:border-0 print:shadow-none">
        {/* letterhead */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#1f6feb] text-white">
              <Stethoscope className="size-6" />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">Ivory Dental Suite</p>
              <p className="text-xs text-gray-500">100ft Road, Indiranagar, Bengaluru 560038</p>
              <p className="text-xs text-gray-500">accounts@ivorydental.in · +91 80 4123 9000</p>
            </div>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-lg font-bold tracking-tight">
              <Pill className="size-5 text-[#1f6feb]" /> PRESCRIPTION
            </p>
            <p className="text-sm text-gray-600">{formatDate(rx.date)}</p>
          </div>
        </div>

        {/* patient + doctor */}
        <div className="grid grid-cols-2 gap-6 py-5 text-sm">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Patient</p>
            <p className="font-semibold">{patientLabel}</p>
            {patient && (
              <p className="text-gray-600">
                {ageFromDob(patient.dob)} yrs · {patient.gender} · {patient.bloodGroup}
              </p>
            )}
            {patient?.allergies?.length ? (
              <p className="mt-1 text-xs font-medium text-red-600">⚠ Allergies: {patient.allergies.join(", ")}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Prescribed by</p>
            <p className="font-semibold">{prescriber}</p>
            {doctor && (
              <p className="text-gray-600">
                {doctor.specialty} · {doctor.reg}
              </p>
            )}
          </div>
        </div>

        {/* Rx symbol + drugs */}
        <div className="flex items-start gap-3">
          <span className="font-serif text-3xl font-bold text-gray-400">℞</span>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="py-2">Medication</th>
                <th className="py-2">Dosage</th>
                <th className="py-2">Frequency</th>
                <th className="py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {rx.items.map((it, i) => (
                <tr key={i} className="border-b border-gray-100 align-top">
                  <td className="py-2.5 font-medium">
                    {it.drug}
                    {it.notes ? <span className="block text-xs font-normal text-gray-500">{it.notes}</span> : null}
                  </td>
                  <td className="py-2.5 text-gray-700">{it.dosage}</td>
                  <td className="py-2.5 text-gray-700">{it.frequency}</td>
                  <td className="py-2.5 text-gray-700">{it.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rx.advice && rx.advice.length > 0 && (
          <div className="mt-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Advice</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
              {rx.advice.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 flex items-end justify-end">
          <div className="text-center">
            <div className="h-10 w-48 border-b border-gray-400" />
            <p className="mt-1 text-xs text-gray-500">{signLabel}</p>
          </div>
        </div>

        <p className="mt-6 border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
          System-generated prescription · Ivory Dental Suite
        </p>
      </div>
    </div>
  );
}
