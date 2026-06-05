"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  CalendarDays,
  CheckCircle2,
  Users,
  Pill,
  BadgeCheck,
  Plus,
  CalendarX2,
  Trash2,
} from "lucide-react";
import type { Provider, TimeOff } from "@/lib/clinic";
import { DENTAL_SPECIALTIES } from "@/lib/clinic";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { cn, formatDate } from "@/lib/utils";

export interface DoctorRow extends Provider {
  appts: number;
  completed: number;
  patients: number;
  rx: number;
  leaves: TimeOff[];
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function DoctorsClient({ doctors }: { doctors: DoctorRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [managingId, setManagingId] = React.useState<string | null>(null);
  const managing = doctors.find((d) => d.id === managingId) ?? null;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add doctor
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((d) => {
          const upcoming = d.leaves.filter((l) => l.to >= todayStr());
          const onLeaveToday = d.leaves.some((l) => l.from <= todayStr() && todayStr() <= l.to);
          return (
            <Card key={d.id} className="overflow-hidden">
              <div className="h-1.5" style={{ background: `hsl(var(--chart-${d.color}))` }} />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-12 items-center justify-center rounded-xl text-lg font-bold text-white"
                    style={{ background: `hsl(var(--chart-${d.color}))` }}
                  >
                    {d.name.split(" ").slice(-1)[0].slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{d.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Stethoscope className="size-3" /> {d.specialty}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="muted">
                    <BadgeCheck className="mr-1 size-3" /> {d.reg}
                  </Badge>
                  {onLeaveToday ? (
                    <Badge variant="out">
                      <CalendarX2 className="mr-1 size-3" /> On leave today
                    </Badge>
                  ) : (
                    upcoming.length > 0 && (
                      <Badge variant="low">
                        <CalendarX2 className="mr-1 size-3" /> {upcoming.length} leave{upcoming.length !== 1 ? "s" : ""}
                      </Badge>
                    )
                  )}
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 border-t pt-3 text-center">
                  <Stat icon={<CalendarDays className="size-3.5" />} label="Today" value={d.appts} />
                  <Stat icon={<CheckCircle2 className="size-3.5" />} label="Done" value={d.completed} />
                  <Stat icon={<Users className="size-3.5" />} label="Patients" value={d.patients} />
                  <Stat icon={<Pill className="size-3.5" />} label="Rx" value={d.rx} />
                </div>

                <Button variant="outline" className="mt-4 w-full" onClick={() => setManagingId(d.id)}>
                  <CalendarX2 className="size-3.5" /> Block calendar / leave
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <AddDoctorSheet
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={() => {
          setAdding(false);
          router.refresh();
        }}
      />

      <ManageLeaveSheet
        doctor={managing}
        onClose={() => setManagingId(null)}
        onChanged={() => router.refresh()}
      />
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ManageLeaveSheet({
  doctor,
  onClose,
  onChanged,
}: {
  doctor: DoctorRow | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [from, setFrom] = React.useState(todayStr());
  const [to, setTo] = React.useState(todayStr());
  const [reason, setReason] = React.useState("");
  const [allDay, setAllDay] = React.useState(true);
  const [startTime, setStartTime] = React.useState("13:00");
  const [endTime, setEndTime] = React.useState("17:00");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (doctor) {
      setFrom(todayStr());
      setTo(todayStr());
      setReason("");
      setAllDay(true);
      setStartTime("13:00");
      setEndTime("17:00");
    }
  }, [doctor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addLeave() {
    if (!doctor || !from) return;
    setBusy(true);
    await fetch("/api/timeoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: doctor.id,
        from,
        to: allDay ? to || from : from, // partial-hour blocks apply to a single day
        reason,
        ...(allDay ? {} : { startTime, endTime }),
      }),
    });
    setBusy(false);
    setReason("");
    onChanged();
  }

  async function removeLeave(id: string) {
    await fetch(`/api/timeoff/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <Sheet
      open={!!doctor}
      onClose={onClose}
      title={doctor ? `${doctor.name} — leave` : undefined}
      description="Block the calendar so no appointments are booked while away"
    >
      {doctor && (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Scheduled leave
            </h3>
            {doctor.leaves.length === 0 ? (
              <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
                No leave scheduled
              </p>
            ) : (
              <div className="space-y-2">
                {doctor.leaves.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                    <CalendarX2 className="size-4 shrink-0 text-warning" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {formatDate(l.from)}
                        {l.to !== l.from ? ` – ${formatDate(l.to)}` : ""}
                        {l.startTime && l.endTime ? ` · ${l.startTime}–${l.endTime}` : " · all day"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{l.reason}</p>
                    </div>
                    <button onClick={() => removeLeave(l.id)} className="text-muted-foreground hover:text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Add leave
            </h3>
            <div className="mb-3 inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setAllDay(true)}
                className={cn("rounded-md px-3 py-1 font-medium", allDay ? "bg-card shadow-sm" : "text-muted-foreground")}
              >
                Whole day(s)
              </button>
              <button
                type="button"
                onClick={() => setAllDay(false)}
                className={cn("rounded-md px-3 py-1 font-medium", !allDay ? "bg-card shadow-sm" : "text-muted-foreground")}
              >
                Specific hours
              </button>
            </div>
            {allDay ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="From">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </Field>
                <Field label="To">
                  <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
                </Field>
              </div>
            ) : (
              <>
                <Field label="Date">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </Field>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="From time">
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </Field>
                  <Field label="To time">
                    <Input type="time" value={endTime} min={startTime} onChange={(e) => setEndTime(e.target.value)} />
                  </Field>
                </div>
              </>
            )}
            <div className="mt-3">
              <Field label="Reason">
                <Input
                  placeholder="Conference, vacation, sick leave…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            </div>
            <Button className="mt-3 w-full" onClick={addLeave} disabled={busy || !from}>
              <Plus className="size-4" /> {allDay ? "Block these dates" : "Block these hours"}
            </Button>
          </section>
        </div>
      )}
    </Sheet>
  );
}

function AddDoctorSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState({ name: "", specialty: DENTAL_SPECIALTIES[0], reg: "" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setForm({ name: "", specialty: DENTAL_SPECIALTIES[0], reg: "" });
  }, [open]);

  const set = (patch: Partial<typeof form>) => setForm((p) => ({ ...p, ...patch }));

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add doctor"
      description="Register a new clinician to the practice"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? "Adding…" : "Add doctor"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name">
          <Input
            autoFocus
            placeholder="Dr. Riya Kapoor"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field label="Specialty">
          <Select
            value={form.specialty}
            onChange={(e) => set({ specialty: e.target.value })}
            className="w-full"
          >
            {DENTAL_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Registration no.">
          <Input
            placeholder="MDS-12345 / BDS-67890"
            value={form.reg}
            onChange={(e) => set({ reg: e.target.value })}
          />
        </Field>
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
