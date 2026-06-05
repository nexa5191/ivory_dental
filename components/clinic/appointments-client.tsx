"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, LogIn, Play, Check, X, ChevronRight, List, LayoutGrid, CalendarDays, CalendarClock } from "lucide-react";
import type { Appointment, ApptStatus, Provider, TimeOff } from "@/lib/clinic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, TypeIcon, formatTime, STATUS_META } from "@/components/clinic/appt-status";
import { cn, formatDate } from "@/lib/utils";

interface PatientLite {
  id: string;
  name: string;
  emoji: string;
}

const STATUSES: ApptStatus[] = ["booked", "arrived", "in-consult", "completed", "no-show"];
type Range = "day" | "week" | "month";
type View = "list" | "board" | "calendar";

const REASONS = [
  "Scaling & polishing",
  "Root canal review",
  "Crown fitting",
  "Composite filling",
  "Braces adjustment",
  "Implant review",
  "Extraction",
  "Routine check-up",
  "Whitening session",
];
const CHAIRS = ["Chair 1", "Chair 2", "Chair 3", "Tele"];

// ---- date helpers (UTC, to stay consistent with the seed data) ----
function dayFloor(iso: string) {
  const [y, mo, d] = isoParts(iso);
  return Date.UTC(y, mo, d);
}
function isoParts(iso: string): [number, number, number] {
  const d = new Date(iso);
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
}
function dayOffset(iso: string, todayIso: string) {
  return Math.round((dayFloor(iso) - dayFloor(todayIso)) / 86400000);
}
function addDays(todayIso: string, offset: number, hour: number) {
  const [y, mo, d] = isoParts(todayIso);
  return new Date(Date.UTC(y, mo, d + offset, hour, 0, 0)).toISOString();
}
function fmtDay(iso: string) {
  const wd = new Date(iso).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  return `${wd} ${formatDate(iso)}`;
}

// Deterministic demo appointments spread across the month so the week / month
// board views have something to show. Real (today's) appointments come from props.
const OFFSETS = [-20, -17, -14, -11, -9, -7, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 8, 11, 14, 18, 21];

function buildSynthetic(todayIso: string, patients: PatientLite[], providers: Provider[]): Appointment[] {
  if (!patients.length) return [];
  const out: Appointment[] = [];
  OFFSETS.forEach((off, oi) => {
    const count = 2 + (oi % 2);
    for (let i = 0; i < count; i++) {
      const seed = Math.abs(off) + i + oi;
      const pat = patients[seed % patients.length];
      const prov = providers[seed % providers.length];
      const status: ApptStatus =
        off < 0 ? (seed % 5 === 0 ? "no-show" : "completed") : seed % 4 === 0 ? "arrived" : "booked";
      out.push({
        id: `syn-${off}-${i}`,
        patientId: pat.id,
        providerId: prov.id,
        start: addDays(todayIso, off, 9 + i * 2),
        durationMin: 30,
        type: seed % 6 === 0 ? "video" : "in-clinic",
        status,
        reason: REASONS[seed % REASONS.length],
        chair: CHAIRS[seed % CHAIRS.length],
      });
    }
  });
  return out;
}

export function AppointmentsClient({
  initial,
  patients,
  providers,
  today,
  timeOff,
}: {
  initial: Appointment[];
  patients: PatientLite[];
  providers: Provider[];
  today: string;
  timeOff: TimeOff[];
}) {
  // is a provider on leave on a given date (and optional HH:MM)?
  const awayOn = React.useCallback(
    (providerId: string, dateStr: string, timeStr?: string) =>
      timeOff.find((t) => {
        if (t.providerId !== providerId) return false;
        if (!(t.from <= dateStr && dateStr <= t.to)) return false;
        if (!t.startTime || !t.endTime) return true; // whole day
        if (!timeStr) return true;
        return timeStr >= t.startTime && timeStr < t.endTime;
      }) ?? null,
    [timeOff]
  );
  const [appts, setAppts] = React.useState<Appointment[]>(() => [
    ...initial,
    ...buildSynthetic(today, patients, providers),
  ]);
  const [provider, setProvider] = React.useState("all");
  const [range, setRange] = React.useState<Range>("day");
  const [view, setView] = React.useState<View>("list");
  const [adding, setAdding] = React.useState(false);
  const [prefillDate, setPrefillDate] = React.useState(today.slice(0, 10));
  const [statusFilter, setStatusFilter] = React.useState<ApptStatus | "all">("all");
  const [rescheduling, setRescheduling] = React.useState<Appointment | null>(null);
  const patient = (id: string) => patients.find((p) => p.id === id);

  function openAdd(dateStr?: string) {
    setPrefillDate(dateStr ?? today.slice(0, 10));
    setAdding(true);
  }

  const inRange = React.useCallback(
    (a: Appointment) => {
      const off = dayOffset(a.start, today);
      if (range === "day") return off === 0;
      if (range === "week") return off >= -3 && off <= 3;
      const [y, mo] = isoParts(a.start);
      const [ty, tmo] = isoParts(today);
      return y === ty && mo === tmo;
    },
    [range, today]
  );

  const rangeFiltered = appts
    .filter((a) => (provider === "all" || a.providerId === provider) && inRange(a))
    .sort((x, y) => x.start.localeCompare(y.start));

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = rangeFiltered.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<ApptStatus, number>);

  // clicking a status chip narrows the list to that stage
  const listItems =
    statusFilter === "all" ? rangeFiltered : rangeFiltered.filter((a) => a.status === statusFilter);

  async function setStatus(id: string, status: ApptStatus) {
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (!id.startsWith("syn-")) {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    }
  }

  async function reschedule(id: string, patch: { start: string; durationMin: number; chair: string }) {
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    setRescheduling(null);
    if (!id.startsWith("syn-")) {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    }
  }

  async function addAppt(form: {
    patientId: string;
    providerId: string;
    reason: string;
    type: string;
    date: string;
    time: string;
    durationMin: number;
    status: ApptStatus;
    chair: string;
  }) {
    const start = `${form.date}T${form.time}:00.000Z`;
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        providerId: form.providerId,
        reason: form.reason,
        type: form.type,
        durationMin: form.durationMin,
        status: form.status,
        chair: form.chair,
        start,
      }),
    });
    const saved = await res.json();
    setAppts((prev) => [...prev, saved]);
    setAdding(false);
  }

  const showDate = range !== "day";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {view !== "calendar" && (
          <Segmented<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        )}
        <Segmented<View>
          value={view}
          onChange={setView}
          options={[
            { value: "list", label: "List", icon: List },
            { value: "board", label: "Board", icon: LayoutGrid },
            { value: "calendar", label: "Calendar", icon: CalendarDays },
          ]}
        />
        {/* clickable status filter (list view) */}
        {view === "list" && (
          <div className="flex flex-wrap items-center gap-1">
            <StatusChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
              All <span className="font-bold">{rangeFiltered.length}</span>
            </StatusChip>
            {STATUSES.map((s) => (
              <StatusChip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter((cur) => (cur === s ? "all" : s))}
              >
                {STATUS_META[s].label} <span className="font-bold">{counts[s]}</span>
              </StatusChip>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="all">All doctors</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button onClick={() => openAdd()}>
            <Plus className="size-4" /> Add appointment
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <CalendarView
          appts={appts.filter((a) => provider === "all" || a.providerId === provider)}
          today={today}
          patient={patient}
          onAddForDate={openAdd}
        />
      ) : view === "board" ? (
        <BoardView
          appts={rangeFiltered}
          patient={patient}
          showDate={showDate}
          onSetStatus={setStatus}
          onReschedule={setRescheduling}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{range} schedule &amp; queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[34rem] divide-y overflow-y-auto scrollbar-thin">
              {listItems.length === 0 && (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  {statusFilter === "all"
                    ? "No appointments in this range"
                    : `No ${STATUS_META[statusFilter].label.toLowerCase()} appointments in this range`}
                </p>
              )}
              {listItems.map((a) => {
                const p = patient(a.patientId);
                const done = a.status === "completed" || a.status === "no-show";
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 px-5 py-3",
                      a.status === "in-consult" && "bg-warning/[0.05]",
                      a.status === "arrived" && "bg-primary/[0.04]"
                    )}
                  >
                    <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                      {formatTime(a.start)}
                      {showDate && <span className="block text-[10px]">{fmtDay(a.start)}</span>}
                    </span>
                    <Link href={`/patients/${a.patientId}`} className="flex min-w-0 flex-1 items-center gap-3 hover:underline">
                      <span className="text-xl">{p?.emoji}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p?.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.reason} · {a.chair}
                        </p>
                      </div>
                    </Link>
                    <TypeIcon type={a.type} className="size-3.5 text-muted-foreground" />
                    <StatusBadge status={a.status} />
                    <ApptActions a={a} onSetStatus={setStatus} onReschedule={setRescheduling} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <RescheduleSheet
        appt={rescheduling}
        onClose={() => setRescheduling(null)}
        onSave={reschedule}
        awayOn={awayOn}
        providerName={(id) => providers.find((p) => p.id === id)?.name ?? "Doctor"}
      />

      <AddAppointmentSheet
        open={adding}
        onClose={() => setAdding(false)}
        patients={patients}
        providers={providers}
        defaultDate={prefillDate}
        today={today}
        onAdd={addAppt}
        awayOn={awayOn}
      />
    </div>
  );
}

function CalendarView({
  appts,
  today,
  patient,
  onAddForDate,
}: {
  appts: Appointment[];
  today: string;
  patient: (id: string) => PatientLite | undefined;
  onAddForDate: (date: string) => void;
}) {
  const [ty, tmo] = isoParts(today);
  const first = new Date(Date.UTC(ty, tmo, 1));
  const startDow = first.getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(ty, tmo + 1, 0)).getUTCDate();
  const monthLabel = first.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const todayDay = isoParts(today)[2];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay = new Map<number, Appointment[]>();
  appts.forEach((a) => {
    const [y, mo, d] = isoParts(a.start);
    if (y === ty && mo === tmo) byDay.set(d, [...(byDay.get(d) ?? []), a]);
  });

  const WK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{monthLabel}</CardTitle>
        <Badge variant="muted">{appts.filter((a) => isoParts(a.start)[1] === tmo && isoParts(a.start)[0] === ty).length} appointments</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-t text-xs">
          {WK.map((w) => (
            <div key={w} className="border-b border-r px-2 py-1.5 text-center font-medium text-muted-foreground last:border-r-0">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            const dayAppts = d ? (byDay.get(d) ?? []).sort((a, b) => a.start.localeCompare(b.start)) : [];
            const isToday = d === todayDay;
            const dateStr = d ? `${ty}-${String(tmo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[6.5rem] border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  !d && "bg-muted/20",
                  isToday && "bg-primary/[0.04]"
                )}
              >
                {d && (
                  <>
                    <div className="mb-1 flex items-center justify-between">
                      <span className={cn("text-xs font-medium", isToday && "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground")}>
                        {d}
                      </span>
                      <button
                        onClick={() => onAddForDate(dateStr)}
                        className="text-muted-foreground/40 hover:text-primary"
                        aria-label={`Add appointment on ${dateStr}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, 3).map((a) => {
                        const p = patient(a.patientId);
                        return (
                          <Link
                            key={a.id}
                            href={`/patients/${a.patientId}`}
                            className={cn(
                              "block truncate rounded px-1 py-0.5 text-[10px] leading-tight",
                              a.status === "completed" && "bg-success/15 text-success",
                              a.status === "no-show" && "bg-danger/10 text-danger",
                              (a.status === "booked" || a.status === "arrived" || a.status === "in-consult") && "bg-primary/10 text-primary"
                            )}
                          >
                            {formatTime(a.start)} {p?.name?.split(" ")[0]}
                          </Link>
                        );
                      })}
                      {dayAppts.length > 3 && (
                        <p className="px-1 text-[10px] text-muted-foreground">+{dayAppts.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ApptActions({
  a,
  onSetStatus,
  onReschedule,
}: {
  a: Appointment;
  onSetStatus: (id: string, s: ApptStatus) => void;
  onReschedule: (a: Appointment) => void;
}) {
  const done = a.status === "completed" || a.status === "no-show";
  return (
    <div className="flex gap-1.5">
      {a.status === "booked" && (
        <Button size="sm" variant="outline" onClick={() => onSetStatus(a.id, "arrived")}>
          <LogIn className="size-3.5" /> Check in
        </Button>
      )}
      {a.status === "arrived" && (
        <Button size="sm" variant="outline" onClick={() => onSetStatus(a.id, "in-consult")}>
          <Play className="size-3.5" /> Start
        </Button>
      )}
      {a.status === "in-consult" && (
        <Button size="sm" onClick={() => onSetStatus(a.id, "completed")}>
          <Check className="size-3.5" /> Complete
        </Button>
      )}
      {a.status !== "in-consult" && a.status !== "completed" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onReschedule(a)}
          title="Reschedule"
        >
          <CalendarClock className="size-3.5" />
        </Button>
      )}
      {!done && a.status !== "in-consult" && (
        <Button size="sm" variant="ghost" className="text-danger" onClick={() => onSetStatus(a.id, "no-show")}>
          <X className="size-3.5" />
        </Button>
      )}
      {done && a.status === "completed" && <ChevronRight className="size-4 text-muted-foreground/40" />}
    </div>
  );
}

function BoardView({
  appts,
  patient,
  showDate,
  onSetStatus,
  onReschedule,
}: {
  appts: Appointment[];
  patient: (id: string) => PatientLite | undefined;
  showDate: boolean;
  onSetStatus: (id: string, s: ApptStatus) => void;
  onReschedule: (a: Appointment) => void;
}) {
  // advancing along the lifecycle when a card is clicked
  const NEXT: Partial<Record<ApptStatus, ApptStatus>> = {
    booked: "arrived",
    arrived: "in-consult",
    "in-consult": "completed",
  };
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {STATUSES.map((status) => {
        const col = appts.filter((a) => a.status === status);
        return (
          <div key={status} className="flex flex-col rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <StatusBadge status={status} />
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">{col.length}</span>
            </div>
            <div className="flex max-h-[30rem] flex-col gap-2 overflow-y-auto scrollbar-thin p-2">
              {col.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground/70">Empty</p>
              )}
              {col.map((a) => {
                const p = patient(a.patientId);
                const next = NEXT[a.status];
                return (
                  <div key={a.id} className="rounded-lg border bg-card p-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p?.emoji}</span>
                      <Link href={`/patients/${a.patientId}`} className="min-w-0 flex-1 hover:underline">
                        <p className="truncate text-sm font-medium">{p?.name}</p>
                      </Link>
                      <TypeIcon type={a.type} className="size-3.5 text-muted-foreground" />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{a.reason}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {formatTime(a.start)}
                        {showDate && ` · ${fmtDay(a.start)}`}
                      </span>
                      <span>{a.chair}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {next && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 flex-1 text-xs"
                          onClick={() => onSetStatus(a.id, next)}
                        >
                          → {STATUS_META[next].label}
                        </Button>
                      )}
                      {a.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => onReschedule(a)}
                          title="Reschedule"
                        >
                          <CalendarClock className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              value === o.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

const CHAIR_OPTS = ["Chair 1", "Chair 2", "Chair 3", "Tele"];

function RescheduleSheet({
  appt,
  onClose,
  onSave,
  awayOn,
  providerName,
}: {
  appt: Appointment | null;
  onClose: () => void;
  onSave: (id: string, patch: { start: string; durationMin: number; chair: string }) => void;
  awayOn: (providerId: string, dateStr: string, timeStr?: string) => TimeOff | null;
  providerName: (id: string) => string;
}) {
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("09:00");
  const [durationMin, setDurationMin] = React.useState(30);
  const [chair, setChair] = React.useState(CHAIR_OPTS[0]);

  React.useEffect(() => {
    if (appt) {
      const d = new Date(appt.start);
      setDate(appt.start.slice(0, 10));
      setTime(
        `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
      );
      setDurationMin(appt.durationMin);
      setChair(appt.chair);
    }
  }, [appt]);

  const away = appt ? awayOn(appt.providerId, date, time) : null;

  return (
    <Sheet
      open={!!appt}
      onClose={onClose}
      title="Reschedule appointment"
      description={appt ? `Move ${appt.reason} to a new slot` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!!away}
            onClick={() =>
              appt && onSave(appt.id, { start: `${date}T${time}:00.000Z`, durationMin, chair })
            }
          >
            <CalendarClock className="size-4" /> Save new time
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {away && appt && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            {providerName(appt.providerId)} is on leave on this date ({away.reason}). Pick another day.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Time</span>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Duration (min)</span>
            <Select value={String(durationMin)} onChange={(e) => setDurationMin(Number(e.target.value))} className="w-full">
              {[15, 20, 30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Chair / room</span>
            <Select value={chair} onChange={(e) => setChair(e.target.value)} className="w-full">
              {CHAIR_OPTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>
    </Sheet>
  );
}

function AddAppointmentSheet({
  open,
  onClose,
  patients,
  providers,
  defaultDate,
  today,
  awayOn,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  patients: PatientLite[];
  providers: Provider[];
  defaultDate: string;
  today: string;
  awayOn: (providerId: string, dateStr: string, timeStr?: string) => TimeOff | null;
  onAdd: (f: {
    patientId: string;
    providerId: string;
    reason: string;
    type: string;
    date: string;
    time: string;
    durationMin: number;
    status: ApptStatus;
    chair: string;
  }) => void;
}) {
  const [patientId, setPatientId] = React.useState(patients[0]?.id ?? "");
  const [providerId, setProviderId] = React.useState(providers[0]?.id ?? "");
  const [reason, setReason] = React.useState("");
  const [type, setType] = React.useState("in-clinic");
  const [date, setDate] = React.useState(defaultDate);
  const [time, setTime] = React.useState("09:00");
  const [durationMin, setDurationMin] = React.useState(30);
  const [chair, setChair] = React.useState(CHAIR_OPTS[0]);

  // a same-day booking lands straight in the queue; future bookings are "booked"
  const isToday = date === today.slice(0, 10);
  const away = awayOn(providerId, date, time);
  const doctorName = providers.find((p) => p.id === providerId)?.name ?? "Doctor";

  React.useEffect(() => {
    if (open) {
      setDate(defaultDate);
      setTime("09:00");
      setReason("");
    }
  }, [open, defaultDate]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add appointment"
      description="Book a slot or register a walk-in"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!!away}
            onClick={() =>
              onAdd({
                patientId,
                providerId,
                reason: reason || "Consultation",
                type,
                date,
                time,
                durationMin,
                status: isToday ? "arrived" : "booked",
                chair,
              })
            }
          >
            {isToday ? "Add to queue" : "Book"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {away && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            {doctorName} is on leave on {date} ({away.reason}). Choose another date or doctor.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Time</span>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Duration (min)</span>
            <Select value={String(durationMin)} onChange={(e) => setDurationMin(Number(e.target.value))} className="w-full">
              {[15, 20, 30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Chair / room</span>
            <Select value={chair} onChange={(e) => setChair(e.target.value)} className="w-full">
              {CHAIR_OPTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Patient</span>
          <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full">
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Doctor</span>
          <Select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="w-full">
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.specialty}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Reason</span>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Toothache, check-up" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</span>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-full">
            <option value="in-clinic">In-clinic</option>
            <option value="video">Video</option>
            <option value="phone">Phone</option>
          </Select>
        </label>
        {!isToday && (
          <p className="text-xs text-muted-foreground">
            Future date → saved as <span className="font-medium text-foreground">Booked</span>.
          </p>
        )}
      </div>
    </Sheet>
  );
}
