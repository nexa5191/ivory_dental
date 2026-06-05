"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, ArrowRight, Clock, ArrowUpRight, Cake, Heart, Gift } from "lucide-react";
import type { Appointment, Invoice, Celebration } from "@/lib/clinic";
import { patientLocation } from "@/lib/clinic";
import { usePrefs, ALL_LOCATIONS } from "@/components/prefs/prefs-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { KpiFlip } from "@/components/dashboard/kpi-flip";
import { Money } from "@/components/ui/money";
import { StatusBadge, TypeIcon, formatTime } from "@/components/clinic/appt-status";
import { formatDate as fmtDate, cn } from "@/lib/utils";

interface PatientLite {
  id: string;
  name: string;
  emoji: string;
  phone: string;
  balance: number;
}

type Period = "this-month" | "last-month" | "fy" | "custom";

// All date math in UTC to match the seed data.
function periodRange(period: Period, todayIso: string, from: string, to: string, fyStart?: number) {
  const d = new Date(todayIso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const monthName = (yy: number, mm: number) =>
    new Date(Date.UTC(yy, mm, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const span = (a: number, b: number, label: string) => ({ from: a, to: b, label });
  const DAY = 86400000;

  if (period === "last-month") {
    const mm = m === 0 ? 11 : m - 1;
    const yy = m === 0 ? y - 1 : y;
    return span(Date.UTC(yy, mm, 1), Date.UTC(yy, mm + 1, 1) - 1, monthName(yy, mm));
  }
  if (period === "fy") {
    // Indian financial year: 1 Apr – 31 Mar
    const start = fyStart ?? (m >= 3 ? y : y - 1);
    return span(
      Date.UTC(start, 3, 1),
      Date.UTC(start + 1, 3, 1) - 1,
      `FY ${start}–${String((start + 1) % 100).padStart(2, "0")}`
    );
  }
  if (period === "custom") {
    const a = from ? Date.parse(from) : -Infinity;
    const b = to ? Date.parse(to) + DAY - 1 : Infinity;
    const label =
      from || to ? `${from || "…"} → ${to || "…"}` : "Custom range";
    return span(a, b, label);
  }
  // this-month (default)
  return span(Date.UTC(y, m, 1), Date.UTC(y, m + 1, 1) - 1, monthName(y, m));
}

export function DashboardClient({
  appts,
  patients,
  invoices,
  providers,
  celebrations,
  todayLabel,
  todayIso,
}: {
  appts: Appointment[];
  patients: PatientLite[];
  invoices: Invoice[];
  providers: { id: string; name: string }[];
  celebrations: Celebration[];
  todayLabel: string;
  todayIso: string;
}) {
  const { location } = usePrefs();
  const all = location === ALL_LOCATIONS;
  const inLoc = (patientId: string) => all || patientLocation(patientId) === location;

  const td = new Date(todayIso);
  const currentFyStart = td.getUTCMonth() >= 3 ? td.getUTCFullYear() : td.getUTCFullYear() - 1;
  const fyOptions = Array.from({ length: 7 }, (_, i) => currentFyStart - 5 + i); // last 5 FYs … next 1

  const [period, setPeriod] = React.useState<Period>("this-month");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [fyStart, setFyStart] = React.useState(currentFyStart);
  const range = React.useMemo(
    () => periodRange(period, todayIso, customFrom, customTo, fyStart),
    [period, todayIso, customFrom, customTo, fyStart]
  );
  const inRange = (iso: string) => {
    const t = Date.parse(iso);
    return t >= range.from && t <= range.to;
  };

  const pmap = React.useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const provName = (id: string) => providers.find((p) => p.id === id)?.name ?? "—";

  // location-scoped, then period-scoped
  const locAppts = appts.filter((a) => inLoc(a.patientId));
  const fAppts = locAppts.filter((a) => inRange(a.start));
  const fInvoices = invoices.filter((i) => inLoc(i.patientId) && inRange(i.date));
  const fPatients = patients.filter((p) => inLoc(p.id));
  const fCeleb = celebrations.filter((c) => inLoc(c.patientId));

  const completed = fAppts.filter((a) => a.status === "completed").length;
  const noShow = fAppts.filter((a) => a.status === "no-show").length;
  const waiting = fAppts.filter((a) => a.status === "arrived").length;
  // the live queue is always "right now", independent of the reporting period
  const queue = locAppts.filter((a) => a.status === "arrived" || a.status === "in-consult");

  const collected = fInvoices.filter((i) => i.status !== "due");
  const received = (i: Invoice) => {
    const paid = (i.payments ?? []).reduce((s, p) => s + p.amount, 0);
    if (paid > 0) return Math.min(paid, i.total);
    return i.status === "paid" ? i.total : i.status === "partial" ? i.total / 2 : 0;
  };
  const collectedTotal = fInvoices.reduce((s, i) => s + received(i), 0);

  const dues = fPatients.filter((p) => p.balance > 0).sort((a, b) => b.balance - a.balance);
  const outstandingTotal = fPatients.reduce((s, p) => s + p.balance, 0);
  const outstandingInvoices = fInvoices.filter((i) => i.status !== "paid");

  const subtitle = `${todayLabel} · Ivory Dental, ${all ? "Bengaluru (all branches)" : location}`;

  const PERIODS: { value: Period; label: string }[] = [
    { value: "this-month", label: "This month" },
    { value: "last-month", label: "Last month" },
    { value: "fy", label: "Financial year" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/billing/new">
            <Button variant="outline">New invoice</Button>
          </Link>
          <Link href="/appointments">
            <Button>
              <CalendarDays className="size-4" /> Manage appointments
            </Button>
          </Link>
        </div>
      </div>

      {/* reporting period */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                period === p.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex items-center gap-1.5">
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 w-auto" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 w-auto" />
          </div>
        )}
        {period === "fy" && (
          <Select
            value={String(fyStart)}
            onChange={(e) => setFyStart(Number(e.target.value))}
            className="h-8 w-auto text-xs font-medium"
            title="Financial year"
          >
            {fyOptions.map((yr) => (
              <option key={yr} value={yr}>
                FY {yr}–{String((yr + 1) % 100).padStart(2, "0")}
              </option>
            ))}
          </Select>
        )}
        <Badge variant="muted" className="ml-auto">
          {range.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiFlip
          label={`Collections · ${range.label}`}
          value={<Money value={collectedTotal} />}
          icon="rupee"
          spark={[32, 41, 36, 44, 47, 43, collectedTotal]}
          delta={{ value: "8.1%", positive: true }}
          back={{
            title: "Collections",
            rows: [
              { label: "Received", value: <Money value={collectedTotal} compact /> },
              { label: "Invoices", value: collected.length },
            ],
            href: "/billing",
            hrefLabel: "Open billing",
          }}
        />
        <KpiFlip
          label={`Appointments · ${range.label}`}
          value={fAppts.length}
          icon="calendar"
          spark={[4, 6, 5, 7, 6, 8, fAppts.length]}
          hint={`${completed} completed · ${queue.length} in queue`}
          back={{
            title: "Today's breakdown",
            rows: [
              { label: "Completed", value: completed },
              { label: "Waiting", value: waiting },
              { label: "No-show", value: noShow },
            ],
            href: "/appointments",
            hrefLabel: "Open calendar",
          }}
        />
        <KpiFlip
          label="Outstanding"
          value={<Money value={outstandingTotal} />}
          icon="rupee"
          tone="warning"
          spark={[12, 9, 14, 11, 8, 10, outstandingTotal]}
          hint={`${dues.length} patients with dues`}
          back={{
            title: "Outstanding",
            rows: [
              { label: "Patients with dues", value: dues.length },
              { label: "Unpaid invoices", value: outstandingInvoices.length },
            ],
            href: "/billing",
            hrefLabel: "Chase payments",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Collections */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Collections</CardTitle>
              <p className="text-sm text-muted-foreground">Payments received</p>
            </div>
            <Link href="/billing" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[22rem] divide-y overflow-y-auto scrollbar-thin">
              {collected.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">No payments yet</p>
              )}
              {collected.map((inv) => {
                const p = pmap.get(inv.patientId);
                return (
                  <Link
                    key={inv.id}
                    href={`/patients/${inv.patientId}`}
                    className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-accent/50"
                  >
                    <span className="text-xl">{p?.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {inv.id} · {fmtDate(inv.date)} · {inv.mode.toUpperCase()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      <Money value={received(inv)} />
                    </span>
                    <Badge variant={inv.status === "paid" ? "good" : "low"}>{inv.status}</Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Appointments</CardTitle>
              <p className="text-sm text-muted-foreground">{range.label}</p>
            </div>
            <Badge variant="default">{queue.length} in queue</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[22rem] divide-y overflow-y-auto scrollbar-thin">
              {fAppts.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">No appointments</p>
              )}
              {fAppts.map((a) => {
                const p = pmap.get(a.patientId);
                return (
                  <Link
                    key={a.id}
                    href={`/patients/${a.patientId}`}
                    className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-accent/50"
                  >
                    <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
                      {formatTime(a.start)}
                    </span>
                    <span className="text-xl">{p?.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.reason} · {provName(a.providerId)}
                      </p>
                    </div>
                    <TypeIcon type={a.type} className="size-3.5 text-muted-foreground" />
                    <StatusBadge status={a.status} />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Outstanding */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Outstanding</CardTitle>
              <p className="text-sm text-muted-foreground">Balances to collect</p>
            </div>
            <Link href="/billing" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[22rem] divide-y overflow-y-auto scrollbar-thin">
              {dues.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">All settled 🎉</p>
              )}
              {dues.map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <span className="text-xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.phone}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-danger">
                    <Money value={p.balance} />
                  </span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground/40" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming birthdays & anniversaries */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="size-4 text-primary" />
            <CardTitle>Upcoming birthdays &amp; anniversaries</CardTitle>
          </div>
          <Badge variant="muted">next 45 days</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {fCeleb.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing coming up</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-thin px-5 pb-4 pt-1">
              {fCeleb.map((c) => (
                <Link
                  key={`${c.patientId}-${c.type}`}
                  href={`/patients/${c.patientId}`}
                  className="flex w-52 shrink-0 items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="relative">
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-card shadow">
                      {c.type === "birthday" ? (
                        <Cake className="size-3 text-primary" />
                      ) : (
                        <Heart className="size-3 text-danger" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.type === "birthday" ? `Turns ${c.years}` : `${c.years} yrs married`}
                    </p>
                    <p className="text-xs font-medium text-primary">
                      {c.inDays === 0 ? "Today 🎉" : c.inDays === 1 ? "Tomorrow" : `in ${c.inDays} days`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {queue.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Live queue</CardTitle>
            <Link href="/appointments">
              <Button variant="secondary" size="sm">
                Go to queue <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {queue.map((a) => {
              const p = pmap.get(a.patientId);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <span className="text-xl">{p?.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p?.name}</p>
                    <p className="text-xs text-muted-foreground">{a.chair}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatTime(a.start)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
