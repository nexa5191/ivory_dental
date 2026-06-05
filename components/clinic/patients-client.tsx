"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, AlertTriangle, ChevronRight } from "lucide-react";
import type { Patient } from "@/lib/clinic";
import { ALLERGY_OPTIONS, CONDITION_OPTIONS } from "@/lib/clinic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { Money } from "@/components/ui/money";
import { ChipSelect } from "./chip-select";
import { GstinAutofill } from "@/components/clinic/gst-autofill";
import { relativeTime } from "@/lib/utils";

type PatientRow = Patient & { age: number };

export function PatientsClient({ initial }: { initial: PatientRow[] }) {
  const router = useRouter();
  const [patients, setPatients] = React.useState(initial);
  const [q, setQ] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const filtered = patients.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q.toLowerCase())
  );

  async function save(form: Partial<Patient>) {
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const saved: Patient = await res.json();
    setPatients((prev) => [{ ...saved, age: 0 }, ...prev]);
    setAdding(false);
    router.push(`/patients/${saved.id}`);
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add patient
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Medical alerts</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Last visit</th>
                <th className="w-8 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/patients/${p.id}`)}
                  className="cursor-pointer border-b transition-colors last:border-0 hover:bg-accent/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.emoji}</span>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.age} yrs · {p.gender} · {p.bloodGroup}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.allergies.map((a) => (
                        <Badge key={a} variant="out">
                          <AlertTriangle className="size-3" /> {a}
                        </Badge>
                      ))}
                      {p.conditions.map((c) => (
                        <Badge key={c} variant="low">
                          {c}
                        </Badge>
                      ))}
                      {p.allergies.length === 0 && p.conditions.length === 0 && (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {p.balance > 0 ? (
                      <span className="font-semibold text-danger">
                        <Money value={p.balance} />
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{relativeTime(p.lastVisit)}</td>
                  <td className="px-4 py-3 text-muted-foreground/40">
                    <ChevronRight className="size-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddPatientSheet open={adding} onClose={() => setAdding(false)} onSave={save} />
    </div>
  );
}

function AddPatientSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (f: Partial<Patient>) => void;
}) {
  const [form, setForm] = React.useState<Partial<Patient>>({
    name: "",
    dob: "",
    gender: "M",
    phone: "",
    email: "",
    bloodGroup: "O+",
    allergies: [],
    conditions: [],
    emoji: "🧑",
  });
  const set = (patch: Partial<Patient>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add patient"
      description="Quick registration — only name is required"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={!form.name}>
            Create &amp; open chart
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name *</span>
          <Input value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Rohan Sharma" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Date of birth</span>
            <Input type="date" value={form.dob ?? ""} onChange={(e) => set({ dob: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Gender</span>
            <Select value={form.gender} onChange={(e) => set({ gender: e.target.value as Patient["gender"] })} className="w-full">
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </Select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone</span>
            <Input value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 …" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Blood group</span>
            <Select value={form.bloodGroup} onChange={(e) => set({ bloodGroup: e.target.value })} className="w-full">
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</span>
          <Input value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} placeholder="name@example.com" />
        </label>
        <GstinAutofill
          value={form.gstin ?? ""}
          onChange={(g) => set({ gstin: g })}
          onResult={(r) => set({ gstin: r.gstin, name: form.name?.trim() ? form.name : r.tradeName })}
          label="GSTIN (corporate / insurer — optional)"
          hint="For B2B patients (companies, insurers). Auto-fill pulls the registered name from the GST portal."
        />
        <div>
          <span className="mb-1.5 block text-xs font-medium text-danger">⚠ Allergies</span>
          <ChipSelect
            options={ALLERGY_OPTIONS}
            value={form.allergies ?? []}
            onChange={(v) => set({ allergies: v })}
            tone="danger"
            placeholder="Add other allergy…"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Medical conditions</span>
          <ChipSelect
            options={CONDITION_OPTIONS}
            value={form.conditions ?? []}
            onChange={(v) => set({ conditions: v })}
            placeholder="Add other condition…"
          />
        </div>
      </div>
    </Sheet>
  );
}
