"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Phone,
  Mail,
  CalendarPlus,
  Pencil,
  Plus,
  Pill,
  Trash2,
  ShieldCheck,
  Stethoscope,
  Cake,
  Heart,
  Receipt,
  Activity,
  Printer,
  FileText,
  Upload,
  X,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import type { Patient, Prescription, Visit, Invoice, InvoiceStatus, PayMode, Provider, ToothStatus, TreatmentItem, XrayImage } from "@/lib/clinic";
import { ALLERGY_OPTIONS, CONDITION_OPTIONS, COMMON_DRUGS, PROCEDURES, toothLabel } from "@/lib/clinic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { Money } from "@/components/ui/money";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { ChipSelect } from "./chip-select";
import { DentalChart } from "./dental-chart";
import { cn, formatDate as fmtDate, formatDayMonth as fmtDayMonth } from "@/lib/utils";

const TABS = ["Overview", "Journey", "Dental chart", "Prescriptions", "Billing"] as const;
type Tab = (typeof TABS)[number];

export function PatientChart({
  patient: initialPatient,
  prescriptions: initialRx,
  visits,
  invoices,
  providers,
  age,
  initialTab,
}: {
  patient: Patient;
  prescriptions: Prescription[];
  visits: Visit[];
  invoices: Invoice[];
  providers: Provider[];
  age: number;
  initialTab?: string;
}) {
  const router = useRouter();
  const [patient, setPatient] = React.useState(initialPatient);
  const [rxList, setRxList] = React.useState(initialRx);
  const [tab, setTab] = React.useState<Tab>(
    (TABS as readonly string[]).includes(initialTab ?? "") ? (initialTab as Tab) : "Overview"
  );
  const [editMedical, setEditMedical] = React.useState(false);
  const [newRx, setNewRx] = React.useState(false);
  const [billingRx, setBillingRx] = React.useState<Prescription | null>(null);
  const [billingPlan, setBillingPlan] = React.useState(false);
  const [journeyFilter, setJourneyFilter] = React.useState<"all" | "appointment" | "rx" | "invoice" | "treatment">("all");
  const providerName = (id: string) => providers.find((p) => p.id === id)?.name ?? "—";

  async function billRx(payload: {
    items: { desc: string; amount: number }[];
    status: InvoiceStatus;
    mode: PayMode;
    rxId?: string;
  }) {
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, ...payload }),
    });
    setBillingRx(null);
    setTab("Billing");
    router.refresh();
  }

  async function persist(patch: Partial<Patient>) {
    const next = { ...patient, ...patch };
    setPatient(next);
    await fetch(`/api/patients/${patient.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  const setTooth = (tooth: number, status: ToothStatus) =>
    persist({ toothFindings: { ...patient.toothFindings, [tooth]: status } });

  const addTreatment = (item: TreatmentItem) =>
    persist({ treatmentPlan: [...patient.treatmentPlan, item] });

  const removeTreatment = (id: string) =>
    persist({ treatmentPlan: patient.treatmentPlan.filter((t) => t.id !== id) });

  // log work + fee against a tooth → a treatment-plan line
  function addWork(tooth: number, procedure: string, fee: number, done: boolean) {
    const phase = patient.treatmentPlan.reduce((m, t) => Math.max(m, t.phase), 0) + 1;
    addTreatment({ id: `tp-${Date.now()}`, tooth, procedure, phase, estimate: fee, status: done ? "done" : "planned" });
  }

  const setTreatmentStatus = (id: string, status: TreatmentItem["status"]) =>
    persist({ treatmentPlan: patient.treatmentPlan.map((t) => (t.id === id ? { ...t, status } : t)) });

  async function billTreatment(payload: {
    items: { desc: string; amount: number }[];
    status: InvoiceStatus;
    mode: PayMode;
    markDoneIds: string[];
  }) {
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, items: payload.items, status: payload.status, mode: payload.mode }),
    });
    if (payload.markDoneIds.length) {
      await persist({
        treatmentPlan: patient.treatmentPlan.map((t) =>
          payload.markDoneIds.includes(t.id) ? { ...t, status: "done", billed: true } : t
        ),
      });
    }
    setBillingPlan(false);
    setTab("Billing");
    router.refresh();
  }

  // X-ray / image uploads (stored as data URLs in the in-memory patient record)
  function uploadXrays(files: FileList) {
    const list = Array.from(files).slice(0, 8);
    Promise.all(
      list.map(
        (f) =>
          new Promise<XrayImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: `xr-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
                name: f.name,
                dataUrl: String(reader.result),
                date: new Date().toISOString(),
              });
            reader.readAsDataURL(f);
          })
      )
    ).then((imgs) => persist({ xrays: [...(patient.xrays ?? []), ...imgs] }));
  }
  const removeXray = (id: string) =>
    persist({ xrays: (patient.xrays ?? []).filter((x) => x.id !== id) });

  async function saveRx(payload: {
    items: Prescription["items"];
    providerId: string;
    date: string;
    advice: string[];
    patientName: string;
    prescriberName: string;
    signName: string;
  }) {
    const res = await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, ...payload }),
    });
    const saved = await res.json();
    setRxList((prev) => [saved, ...prev]);
    setNewRx(false);
  }

  // only work not yet invoiced shows in the chart's work list
  const unbilledPlan = patient.treatmentPlan.filter((t) => !t.billed);
  const planTotal = unbilledPlan.reduce((s, t) => s + t.estimate, 0);

  // Unified journey — every recorded touchpoint, newest first. Invoices carry
  // the line items that show exactly what work was billed.
  interface JEvent {
    id: string;
    date: string;
    kind: "visit" | "rx" | "invoice" | "treatment";
    title: string;
    detail: string;
    meta: string;
    amount?: number;
    status?: string;
  }
  const journey: JEvent[] = [
    ...visits.map((v) => ({
      id: v.id, date: v.date, kind: "visit" as const,
      title: v.complaint, detail: v.notes, meta: providerName(v.providerId),
    })),
    ...rxList.map((rx) => ({
      id: rx.id, date: rx.date, kind: "rx" as const,
      title: "Prescription issued", detail: rx.items.map((i) => i.drug).join(", "), meta: providerName(rx.providerId),
    })),
    ...invoices.map((inv) => ({
      id: inv.id, date: inv.date, kind: "invoice" as const,
      title: `Invoice ${inv.id}`, detail: inv.items.map((i) => i.desc).join(", "),
      meta: inv.mode.toUpperCase(), amount: inv.total, status: inv.status,
    })),
    ...patient.treatmentPlan
      .filter((t) => t.status !== "planned")
      .map((t) => ({
        id: t.id, date: patient.lastVisit, kind: "treatment" as const,
        title: t.procedure, detail: t.tooth ? `Tooth ${toothLabel(t.tooth)} · Phase ${t.phase}` : `Phase ${t.phase}`,
        meta: t.status, amount: t.estimate,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const journeyIcon = {
    visit: { Icon: Stethoscope, tone: "text-primary bg-primary/15" },
    rx: { Icon: Pill, tone: "text-primary bg-primary/10" },
    invoice: { Icon: Receipt, tone: "text-success bg-success/15" },
    treatment: { Icon: Activity, tone: "text-warning bg-warning/15" },
  } as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted" />

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              {age} yrs · {patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : "Other"} ·{" "}
              {patient.bloodGroup}
              {patient.abhaId && <> · ABHA {patient.abhaId}</>}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="size-3" /> {patient.phone || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="size-3" /> {patient.email || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Cake className="size-3" /> {fmtDayMonth(patient.dob)}
              </span>
              {patient.anniversary && (
                <span className="flex items-center gap-1">
                  <Heart className="size-3" /> Anniversary {fmtDayMonth(patient.anniversary)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Balance due</p>
              <p className={cn("text-lg font-bold", patient.balance > 0 ? "text-danger" : "text-success")}>
                <Money value={patient.balance} />
              </p>
            </div>
            <Link href="/appointments">
              <Button size="sm">
                <CalendarPlus className="size-4" /> Book
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Allergy / medical alert banner */}
      {(patient.allergies.length > 0 || patient.conditions.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3">
          <AlertTriangle className="size-4 shrink-0 text-danger" />
          {patient.allergies.length > 0 ? (
            <span className="text-sm font-semibold text-danger">Allergies:</span>
          ) : (
            <span className="text-sm font-semibold text-warning">Medical:</span>
          )}
          {patient.allergies.map((a) => (
            <Badge key={a} variant="out">
              {a}
            </Badge>
          ))}
          {patient.conditions.map((c) => (
            <Badge key={c} variant="low">
              {c}
            </Badge>
          ))}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditMedical(true)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Medical history</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setEditMedical(true)}>
                <Pencil className="size-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium text-danger">Allergies</p>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.length ? (
                    patient.allergies.map((a) => <Badge key={a} variant="out">{a}</Badge>)
                  ) : (
                    <span className="text-muted-foreground">None recorded</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Conditions</p>
                <div className="flex flex-wrap gap-1">
                  {patient.conditions.length ? (
                    patient.conditions.map((c) => <Badge key={c} variant="low">{c}</Badge>)
                  ) : (
                    <span className="text-muted-foreground">None recorded</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Visit timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No visits yet</p>
              ) : (
                <ol className="relative space-y-4 border-l pl-5">
                  {visits.map((v) => (
                    <li key={v.id} className="relative">
                      <span className="absolute -left-[26px] top-1 flex size-4 items-center justify-center rounded-full bg-primary/15">
                        <Stethoscope className="size-2.5 text-primary" />
                      </span>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{v.complaint}</p>
                        <span className="text-xs text-muted-foreground">{fmtDate(v.date)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{providerName(v.providerId)}</p>
                      <p className="mt-1 text-sm">{v.notes}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "Journey" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <Receipt className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Every visit, prescription and procedure is logged here. Work is <span className="font-medium text-foreground">recorded for billing</span>{" "}
              when a procedure is completed: planned treatments carry an estimate, and each invoice below lists the exact
              procedures billed — so the journey doubles as the patient&apos;s financial ledger.
            </p>
          </div>
          {(() => {
            const JF: { key: typeof journeyFilter; label: string }[] = [
              { key: "all", label: "All" },
              { key: "appointment", label: "Appointments" },
              { key: "rx", label: "Prescriptions" },
              { key: "invoice", label: "Invoices" },
              { key: "treatment", label: "Treatments" },
            ];
            const kindFor = (f: typeof journeyFilter) => (f === "appointment" ? "visit" : f);
            const journeyShown =
              journeyFilter === "all" ? journey : journey.filter((e) => e.kind === kindFor(journeyFilter));
            return (
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle>Care journey</CardTitle>
                  <Badge variant="muted">{journeyShown.length} events</Badge>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {JF.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setJourneyFilter(f.key)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          journeyFilter === f.key
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {journeyShown.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nothing in this category yet</p>
                  ) : (
                    <ol className="relative space-y-4 border-l pl-5">
                      {journeyShown.map((e) => {
                    const { Icon, tone } = journeyIcon[e.kind];
                    return (
                      <li key={`${e.kind}-${e.id}`} className="relative">
                        <span className={cn("absolute -left-[26px] top-0.5 flex size-5 items-center justify-center rounded-full", tone)}>
                          <Icon className="size-3" />
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          {(() => {
                            const href =
                              e.kind === "visit"
                                ? `/patients/${patient.id}/visit/${e.id}`
                                : e.kind === "rx"
                                  ? `/patients/${patient.id}/rx/${e.id}`
                                  : e.kind === "invoice"
                                    ? `/billing/${e.id}`
                                    : null;
                            return href ? (
                              <Link
                                href={href}
                                target={e.kind === "visit" ? undefined : "_blank"}
                                className="text-sm font-medium hover:text-primary hover:underline"
                              >
                                {e.title}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium">{e.title}</p>
                            );
                          })()}
                          <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(e.date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{e.detail}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          {e.kind === "invoice" && e.status && (
                            <Badge variant={e.status === "paid" ? "good" : e.status === "due" ? "out" : "low"}>{e.status}</Badge>
                          )}
                          {e.kind === "treatment" && (
                            <Badge variant={e.meta === "done" ? "good" : "low"}>{e.meta}</Badge>
                          )}
                          {(e.kind === "visit" || e.kind === "rx") && (
                            <span className="text-muted-foreground">{e.meta}</span>
                          )}
                          {e.amount != null && (
                            <span className="ml-auto font-semibold tabular-nums">
                              <Money value={e.amount} />
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                    </ol>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {tab === "Dental chart" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dental chart</CardTitle>
            </CardHeader>
            <CardContent>
              <DentalChart
                findings={patient.toothFindings}
                procedures={PROCEDURES}
                onSet={setTooth}
                onAddWork={addWork}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Treatment &amp; work</CardTitle>
                <Badge variant="muted">
                  Est. <Money value={planTotal} />
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {unbilledPlan.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                    <button
                      onClick={() => setTreatmentStatus(t.id, t.status === "done" ? "planned" : "done")}
                      title={t.status === "done" ? "Mark as planned" : "Mark work done"}
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        t.status === "done" ? "border-success bg-success text-white" : "text-transparent hover:border-primary"
                      )}
                    >
                      <Check className="size-3" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", t.status === "done" && "text-muted-foreground line-through")}>
                        {t.procedure}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.tooth ? `Tooth ${toothLabel(t.tooth)} · ` : ""}
                        {t.status === "done" ? "Done" : t.status === "in-progress" ? "In progress" : "Planned"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      <Money value={t.estimate} />
                    </span>
                    <button onClick={() => removeTreatment(t.id)} className="text-muted-foreground hover:text-danger">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                {unbilledPlan.length === 0 && (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    No unbilled work. Click a tooth to log work &amp; fee.
                  </p>
                )}
                {unbilledPlan.length > 0 && (
                  <Button variant="outline" className="w-full" onClick={() => setBillingPlan(true)}>
                    <Receipt className="size-4" /> Invoice this work
                  </Button>
                )}
                <AddTreatment onAdd={addTreatment} />
              </CardContent>
            </Card>

            <XrayCard xrays={patient.xrays ?? []} onUpload={uploadXrays} onRemove={removeXray} />
          </div>
        </div>
      )}

      {tab === "Prescriptions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNewRx(true)}>
              <Plus className="size-4" /> New prescription
            </Button>
          </div>
          {rxList.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No prescriptions issued yet
              </CardContent>
            </Card>
          ) : (
            rxList.map((rx) => (
              <Card key={rx.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="size-4 text-primary" />
                    <CardTitle className="text-base">Rx · {fmtDate(rx.date)}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {rx.prescriberName ?? providerName(rx.providerId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/patients/${patient.id}/rx/${rx.id}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" title="View / print prescription">
                        <Printer className="size-3.5" /> View
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => setBillingRx(rx)}>
                      <Receipt className="size-3.5" /> Add to bill
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-2 font-medium">Drug</th>
                        <th className="px-5 py-2 font-medium">Dosage</th>
                        <th className="px-5 py-2 font-medium">Frequency</th>
                        <th className="px-5 py-2 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.items.map((it, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-5 py-2 font-medium">{it.drug}</td>
                          <td className="px-5 py-2 text-muted-foreground">{it.dosage}</td>
                          <td className="px-5 py-2 text-muted-foreground">{it.frequency}</td>
                          <td className="px-5 py-2 text-muted-foreground">{it.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rx.advice && rx.advice.length > 0 && (
                    <div className="px-5 py-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Advice</p>
                      <ul className="list-disc space-y-0.5 pl-5 text-sm text-foreground/90">
                        {rx.advice.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "Billing" && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No invoices</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Invoice</th>
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium">Mode</th>
                    <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="px-5 py-3 font-mono text-xs font-medium">{inv.id}</td>
                      <td className="px-5 py-3 text-muted-foreground">{fmtDate(inv.date)}</td>
                      <td className="px-5 py-3 uppercase text-muted-foreground">{inv.mode}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">
                        <Money value={inv.total} />
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={inv.status === "paid" ? "good" : inv.status === "due" ? "out" : "low"}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit medical sheet */}
      <Sheet
        open={editMedical}
        onClose={() => setEditMedical(false)}
        title="Edit medical info"
        description="Allergies and conditions"
        footer={
          <Button onClick={() => setEditMedical(false)} className="ml-auto">
            Done
          </Button>
        }
      >
        <div className="space-y-5">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-danger">Allergies</span>
            <ChipSelect
              options={ALLERGY_OPTIONS}
              value={patient.allergies}
              onChange={(v) => persist({ allergies: v })}
              tone="danger"
              placeholder="Add other allergy…"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Conditions</span>
            <ChipSelect
              options={CONDITION_OPTIONS}
              value={patient.conditions}
              onChange={(v) => persist({ conditions: v })}
              placeholder="Add other condition…"
            />
          </div>
        </div>
      </Sheet>

      {/* New Rx sheet */}
      <NewRxSheet
        open={newRx}
        onClose={() => setNewRx(false)}
        providers={providers}
        patientName={patient.name}
        onSave={saveRx}
      />
      <BillRxSheet
        prescription={billingRx}
        onClose={() => setBillingRx(null)}
        onBill={billRx}
      />
      <BillTreatmentSheet
        open={billingPlan}
        plan={unbilledPlan}
        onClose={() => setBillingPlan(false)}
        onBill={billTreatment}
      />
    </div>
  );
}

function AddTreatment({ onAdd }: { onAdd: (item: TreatmentItem) => void }) {
  const { currency } = usePrefs();
  const rate = currency.rate || 1;
  const [open, setOpen] = React.useState(false);
  const [procedure, setProcedure] = React.useState(PROCEDURES[2]);
  const [tooth, setTooth] = React.useState("");
  const [estimate, setEstimate] = React.useState("");

  if (!open)
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add procedure
      </Button>
    );

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Select value={procedure} onChange={(e) => setProcedure(e.target.value)} className="w-full">
        {PROCEDURES.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </Select>
      <div className="flex gap-2">
        <Input placeholder="Tooth (FDI)" value={tooth} onChange={(e) => setTooth(e.target.value)} className="w-24" />
        <Input
          type="number"
          placeholder={`Fee (${currency.symbol})`}
          value={estimate}
          onChange={(e) => setEstimate(e.target.value)}
          className="flex-1"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => {
            onAdd({
              id: `tp-${Date.now()}`,
              tooth: tooth ? Number(tooth) : null,
              procedure,
              phase: 1,
              estimate: (Number(estimate) || 0) / rate, // entered in active currency → store base
              status: "planned",
            });
            setOpen(false);
            setTooth("");
            setEstimate("");
          }}
        >
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

const FREQUENCIES = ["OD (1x/day)", "BID (2x/day)", "TID (3x/day)", "QID (4x/day)", "SOS (as needed)"];

function NewRxSheet({
  open,
  onClose,
  providers,
  patientName: defaultPatientName,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  providers: Provider[];
  patientName: string;
  onSave: (payload: {
    items: Prescription["items"];
    providerId: string;
    date: string;
    advice: string[];
    patientName: string;
    prescriberName: string;
    signName: string;
  }) => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [providerId, setProviderId] = React.useState(providers[0]?.id ?? "");
  const [date, setDate] = React.useState(todayStr);
  const [patientName, setPatientName] = React.useState(defaultPatientName);
  // prescriber/sign names default to the selected doctor but can be overridden
  const [prescriberName, setPrescriberName] = React.useState(providers[0]?.name ?? "");
  const [prescriberEdited, setPrescriberEdited] = React.useState(false);
  const [signName, setSignName] = React.useState(providers[0]?.name ?? "");
  const [signEdited, setSignEdited] = React.useState(false);
  const [rows, setRows] = React.useState<Prescription["items"]>([
    { drug: COMMON_DRUGS[0], dosage: "1 tab", frequency: FREQUENCIES[2], duration: "5 days", notes: "" },
  ]);
  const [advice, setAdvice] = React.useState<string[]>([""]);

  // reset to defaults whenever reopened
  React.useEffect(() => {
    if (open) {
      const pid = providers[0]?.id ?? "";
      const pname = providers.find((p) => p.id === pid)?.name ?? "";
      setProviderId(pid);
      setDate(todayStr);
      setPatientName(defaultPatientName);
      setPrescriberName(pname);
      setPrescriberEdited(false);
      setSignName(pname);
      setSignEdited(false);
      setRows([{ drug: COMMON_DRUGS[0], dosage: "1 tab", frequency: FREQUENCIES[2], duration: "5 days", notes: "" }]);
      setAdvice([""]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // when the doctor changes, follow it for any name fields the user hasn't edited
  function changeProvider(id: string) {
    setProviderId(id);
    const name = providers.find((p) => p.id === id)?.name ?? "";
    if (!prescriberEdited) setPrescriberName(name);
    if (!signEdited) setSignName(name);
  }

  const update = (i: number, patch: Partial<Prescription["items"][number]>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addRow = () =>
    setRows((r) => [...r, { drug: COMMON_DRUGS[0], dosage: "1 tab", frequency: FREQUENCIES[1], duration: "3 days", notes: "" }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New prescription"
      description="Medicines, advice bullets — date & names are pre-filled and editable"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                items: rows,
                providerId,
                date: new Date(`${date}T10:00:00.000Z`).toISOString(),
                advice: advice.map((a) => a.trim()).filter(Boolean),
                patientName: patientName.trim() || defaultPatientName,
                prescriberName: prescriberName.trim(),
                signName: signName.trim() || prescriberName.trim(),
              })
            }
          >
            Issue Rx
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Patient name</span>
            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Prescribing doctor</span>
          <Select value={providerId} onChange={(e) => changeProvider(e.target.value)} className="w-full">
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Doctor name (printed)</span>
            <Input
              value={prescriberName}
              onChange={(e) => {
                setPrescriberName(e.target.value);
                setPrescriberEdited(true);
              }}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Sign as</span>
            <Input
              value={signName}
              onChange={(e) => {
                setSignName(e.target.value);
                setSignEdited(true);
              }}
            />
          </label>
        </div>

        {rows.map((row, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Medicine {i + 1}</span>
              {rows.length > 1 && (
                <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-danger">
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <Input list="drugs" value={row.drug} onChange={(e) => update(i, { drug: e.target.value })} placeholder="Drug name" />
            <div className="grid grid-cols-3 gap-2">
              <Input value={row.dosage} onChange={(e) => update(i, { dosage: e.target.value })} placeholder="Dosage" />
              <Select value={row.frequency} onChange={(e) => update(i, { frequency: e.target.value })}>
                {FREQUENCIES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </Select>
              <Input value={row.duration} onChange={(e) => update(i, { duration: e.target.value })} placeholder="Duration" />
            </div>
          </div>
        ))}
        <datalist id="drugs">
          {COMMON_DRUGS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
        <Button variant="outline" className="w-full" onClick={addRow}>
          <Plus className="size-4" /> Add another medicine
        </Button>

        {/* free-text advice bullets */}
        <div className="rounded-lg border p-3">
          <span className="mb-2 block text-xs font-medium text-muted-foreground">Advice / instructions</span>
          <div className="space-y-2">
            {advice.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <Input
                  value={a}
                  placeholder="e.g. Warm saline rinse 2x/day; soft diet for 3 days"
                  onChange={(e) => setAdvice((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                />
                {advice.length > 1 && (
                  <button
                    onClick={() => setAdvice((p) => p.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setAdvice((p) => [...p, ""])}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="size-3.5" /> Add bullet
          </button>
        </div>
      </div>
    </Sheet>
  );
}

interface BillLine {
  desc: string;
  amount: string;
}

function BillRxSheet({
  prescription,
  onClose,
  onBill,
}: {
  prescription: Prescription | null;
  onClose: () => void;
  onBill: (p: { items: { desc: string; amount: number }[]; status: InvoiceStatus; mode: PayMode; rxId?: string }) => void;
}) {
  const { currency } = usePrefs();
  const rate = currency.rate || 1;
  const [lines, setLines] = React.useState<BillLine[]>([]);
  const [status, setStatus] = React.useState<InvoiceStatus>("paid");
  const [mode, setMode] = React.useState<PayMode>("upi");

  React.useEffect(() => {
    if (prescription) {
      setLines([
        { desc: "Consultation", amount: String(Math.round(15 * rate)) },
        ...prescription.items.map((it) => ({ desc: `Medication — ${it.drug}`, amount: "" })),
      ]);
      setStatus("paid");
      setMode("upi");
    }
  }, [prescription, rate]);

  const setLine = (i: number, patch: Partial<BillLine>) =>
    setLines((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  // amounts are typed in the active currency → base = entered / rate
  const total = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0) / rate;
  const valid = lines.some((l) => l.desc.trim() && parseFloat(l.amount) > 0);

  return (
    <Sheet
      open={!!prescription}
      onClose={onClose}
      title="Bill prescription"
      description="Charge the consultation and dispensed medicines to the patient"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() =>
              onBill({
                items: lines
                  .filter((l) => l.desc.trim() && parseFloat(l.amount) > 0)
                  .map((l) => ({ desc: l.desc.trim(), amount: parseFloat(l.amount) / rate })),
                status,
                mode,
                rxId: prescription?.id,
              })
            }
          >
            <Receipt className="size-4" /> Create invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={l.desc} onChange={(e) => setLine(i, { desc: e.target.value })} className="flex-1" />
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={l.amount}
                onChange={(e) => setLine(i, { amount: e.target.value })}
                className="w-24"
              />
              {lines.length > 1 && (
                <button
                  onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setLines((p) => [...p, { desc: "", amount: "" }])}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="size-3.5" /> Add line
        </button>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)} className="w-full">
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Mode</span>
            <Select value={mode} onChange={(e) => setMode(e.target.value as PayMode)} className="w-full">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="online">Online</option>
            </Select>
          </label>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-lg font-bold tabular-nums">
            <Money value={total} />
          </span>
        </div>
      </div>
    </Sheet>
  );
}

function XrayCard({
  xrays,
  onUpload,
  onRemove,
}: {
  xrays: XrayImage[];
  onUpload: (files: FileList) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-4 text-primary" /> X-rays &amp; images
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="size-3.5" /> Upload
        </Button>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onUpload(e.target.files);
            e.target.value = "";
          }}
        />
        {xrays.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Upload className="size-6 opacity-50" />
            Upload radiographs / clinical photos
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {xrays.map((x) => (
              <div key={x.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a href={x.dataUrl} target="_blank" rel="noreferrer">
                  <img
                    src={x.dataUrl}
                    alt={x.name}
                    className="aspect-square w-full rounded-md border object-cover"
                  />
                </a>
                <button
                  onClick={() => onRemove(x.id)}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-muted-foreground opacity-0 shadow group-hover:opacity-100 hover:text-danger"
                  title="Remove"
                >
                  <X className="size-3.5" />
                </button>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground" title={x.name}>
                  {x.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BillTreatmentSheet({
  open,
  plan,
  onClose,
  onBill,
}: {
  open: boolean;
  plan: TreatmentItem[];
  onClose: () => void;
  onBill: (p: {
    items: { desc: string; amount: number }[];
    status: InvoiceStatus;
    mode: PayMode;
    markDoneIds: string[];
  }) => void;
}) {
  const { currency } = usePrefs();
  const rate = currency.rate || 1;
  const [sel, setSel] = React.useState<Record<string, boolean>>({});
  const [amt, setAmt] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<InvoiceStatus>("paid");
  const [mode, setMode] = React.useState<PayMode>("upi");

  React.useEffect(() => {
    if (open) {
      const s: Record<string, boolean> = {};
      const a: Record<string, string> = {};
      plan.forEach((t) => {
        s[t.id] = true;
        a[t.id] = String(Math.round(t.estimate * rate)); // show in active currency
      });
      setSel(s);
      setAmt(a);
      setStatus("paid");
      setMode("upi");
    }
  }, [open, plan, rate]);

  const chosen = plan
    .filter((t) => sel[t.id])
    .map((t) => ({
      id: t.id,
      desc: `${t.procedure}${t.tooth ? ` (Tooth ${toothLabel(t.tooth)})` : ""}`,
      amount: (parseFloat(amt[t.id]) || 0) / rate, // entered in active currency → base
    }))
    .filter((l) => l.amount > 0);
  const total = chosen.reduce((s, l) => s + l.amount, 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Invoice tooth work"
      description="Select the completed/planned work to bill the patient"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={chosen.length === 0}
            onClick={() =>
              onBill({
                items: chosen.map(({ desc, amount }) => ({ desc, amount })),
                status,
                mode,
                markDoneIds: chosen.map((l) => l.id),
              })
            }
          >
            <Receipt className="size-4" /> Create invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {plan.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border p-2.5">
              <input
                type="checkbox"
                checked={!!sel[t.id]}
                onChange={(e) => setSel((p) => ({ ...p, [t.id]: e.target.checked }))}
                className="size-4 accent-[hsl(var(--primary))]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.procedure}</p>
                <p className="text-xs text-muted-foreground">
                  {t.tooth ? `Tooth ${toothLabel(t.tooth)}` : `Phase ${t.phase}`}
                </p>
              </div>
              <Input
                type="number"
                min="0"
                value={amt[t.id] ?? ""}
                onChange={(e) => setAmt((p) => ({ ...p, [t.id]: e.target.value }))}
                className="w-24"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)} className="w-full">
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Mode</span>
            <Select value={mode} onChange={(e) => setMode(e.target.value as PayMode)} className="w-full">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="online">Online</option>
            </Select>
          </label>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-lg font-bold tabular-nums">
            <Money value={total} />
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">Billed items are marked done in the treatment plan.</p>
      </div>
    </Sheet>
  );
}
