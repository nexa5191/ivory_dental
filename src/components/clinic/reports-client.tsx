"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, X, SlidersHorizontal, GripVertical, FileDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { StatusBadge } from "@/components/clinic/appt-status";
import type { ApptStatus } from "@/lib/clinic";
import { cn, formatDate as fmtDate } from "@/lib/utils";

// ---- incoming data shapes ----
interface InvoiceRow {
  id: string; date: string; patientId: string; patientName: string;
  total: number; status: "paid" | "partial" | "due"; mode: string;
}
interface ApptRow {
  id: string; date: string; patientId: string; patientName: string;
  providerId: string; providerName: string; type: string; status: ApptStatus;
  reason: string; chair: string;
}
interface PatientRow {
  id: string; name: string; phone: string; balance: number;
  lastVisit: string; gender: string; conditions: string[];
}
interface TreatmentRow {
  id: string; patientId: string; patientName: string; tooth: number | null;
  procedure: string; phase: number; estimate: number; status: string;
}

interface Filters {
  from: string;
  to: string;
  provider: string;
  status: string;
  patient: string;
  mode: string;
  sortBy: "date" | "amount" | "name";
  sortOrder: "asc" | "desc";
}

const DEFAULT_FILTERS: Filters = {
  from: "", to: "", provider: "all", status: "all", patient: "all", mode: "all",
  sortBy: "date", sortOrder: "desc",
};

type Row = Record<string, unknown>;
interface Column {
  key: string;
  label: string;
  align?: "right";
  cell: (r: Row) => React.ReactNode;
}
interface ReportDef {
  key: string;
  label: string;
  columns: Column[];
  build: (data: Data, f: Filters) => Row[];
}
interface Data {
  invoices: InvoiceRow[];
  appointments: ApptRow[];
  patients: PatientRow[];
  treatments: TreatmentRow[];
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
}
function inDateRange(iso: string, from: string, to: string) {
  const d = iso.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}
function billBadge(s: string) {
  return <Badge variant={s === "paid" ? "good" : s === "due" ? "out" : "low"}>{s}</Badge>;
}
function plainBadge(s: string) {
  return <Badge variant={s === "done" ? "good" : s === "in-progress" ? "low" : "muted"}>{s}</Badge>;
}

function sortRows(rows: Row[], f: Filters): Row[] {
  const key = f.sortBy === "amount" ? "_amount" : f.sortBy === "name" ? "_name" : "_date";
  const out = [...rows].sort((a, b) => {
    const av = a[key] as string | number | undefined;
    const bv = b[key] as string | number | undefined;
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return av < bv ? -1 : av > bv ? 1 : 0;
  });
  return f.sortOrder === "desc" ? out.reverse() : out;
}

const REPORTS: ReportDef[] = [
  {
    key: "collections",
    label: "Collections",
    columns: [
      { key: "id", label: "Invoice", cell: (r) => <span className="font-mono text-xs">{r.id as string}</span> },
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "patient", label: "Patient", cell: (r) => r.patientName as string },
      { key: "mode", label: "Mode", cell: (r) => <span className="uppercase">{r.mode as string}</span> },
      { key: "amount", label: "Amount", align: "right", cell: (r) => <Money value={r.total as number} /> },
      { key: "status", label: "Status", cell: (r) => billBadge(r.status as string) },
    ],
    build: (d, f) =>
      d.invoices
        .filter((i) => i.status !== "due")
        .filter((i) => inDateRange(i.date, f.from, f.to))
        .filter((i) => f.status === "all" || i.status === f.status)
        .filter((i) => f.patient === "all" || i.patientId === f.patient)
        .filter((i) => f.mode === "all" || i.mode === f.mode)
        .map((i) => ({ ...i, _date: i.date, _amount: i.total, _name: i.patientName })),
  },
  {
    key: "outstanding",
    label: "Outstanding",
    columns: [
      { key: "id", label: "Invoice", cell: (r) => <span className="font-mono text-xs">{r.id as string}</span> },
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "patient", label: "Patient", cell: (r) => r.patientName as string },
      { key: "amount", label: "Amount", align: "right", cell: (r) => <Money value={r.total as number} /> },
      { key: "status", label: "Status", cell: (r) => billBadge(r.status as string) },
      { key: "mode", label: "Mode", cell: (r) => <span className="uppercase">{r.mode as string}</span> },
    ],
    build: (d, f) =>
      d.invoices
        .filter((i) => i.status !== "paid")
        .filter((i) => inDateRange(i.date, f.from, f.to))
        .filter((i) => f.status === "all" || i.status === f.status)
        .filter((i) => f.patient === "all" || i.patientId === f.patient)
        .map((i) => ({ ...i, _date: i.date, _amount: i.total, _name: i.patientName })),
  },
  {
    key: "appointments",
    label: "Appointments",
    columns: [
      { key: "date", label: "Date", cell: (r) => fmtDate(r.date as string) },
      { key: "time", label: "Time", cell: (r) => fmtTime(r.date as string) },
      { key: "patient", label: "Patient", cell: (r) => r.patientName as string },
      { key: "provider", label: "Doctor", cell: (r) => r.providerName as string },
      { key: "type", label: "Type", cell: (r) => <span className="capitalize">{r.type as string}</span> },
      { key: "status", label: "Status", cell: (r) => <StatusBadge status={r.status as ApptStatus} /> },
      { key: "reason", label: "Reason", cell: (r) => r.reason as string },
      { key: "chair", label: "Chair", cell: (r) => r.chair as string },
    ],
    build: (d, f) =>
      d.appointments
        .filter((a) => inDateRange(a.date, f.from, f.to))
        .filter((a) => f.provider === "all" || a.providerId === f.provider)
        .filter((a) => f.status === "all" || a.status === f.status)
        .filter((a) => f.patient === "all" || a.patientId === f.patient)
        .map((a) => ({ ...a, _date: a.date, _amount: 0, _name: a.patientName })),
  },
  {
    key: "treatments",
    label: "Treatment Plans",
    columns: [
      { key: "patient", label: "Patient", cell: (r) => r.patientName as string },
      { key: "tooth", label: "Tooth", cell: (r) => (r.tooth == null ? "—" : (r.tooth as number)) },
      { key: "procedure", label: "Procedure", cell: (r) => r.procedure as string },
      { key: "phase", label: "Phase", cell: (r) => r.phase as number },
      { key: "estimate", label: "Estimate", align: "right", cell: (r) => <Money value={r.estimate as number} /> },
      { key: "status", label: "Status", cell: (r) => plainBadge(r.status as string) },
    ],
    build: (d, f) =>
      d.treatments
        .filter((t) => f.status === "all" || t.status === f.status)
        .filter((t) => f.patient === "all" || t.patientId === f.patient)
        .map((t) => ({ ...t, _date: "", _amount: t.estimate, _name: t.patientName })),
  },
  {
    key: "ledger",
    label: "Patient Ledger",
    columns: [
      { key: "name", label: "Patient", cell: (r) => r.name as string },
      { key: "phone", label: "Phone", cell: (r) => <span className="text-muted-foreground">{r.phone as string}</span> },
      { key: "lastVisit", label: "Last visit", cell: (r) => fmtDate(r.lastVisit as string) },
      { key: "balance", label: "Balance", align: "right", cell: (r) => <Money value={r.balance as number} /> },
      {
        key: "conditions",
        label: "Conditions",
        cell: (r) => {
          const c = r.conditions as string[];
          return c.length ? c.join(", ") : <span className="text-muted-foreground">—</span>;
        },
      },
    ],
    build: (d, f) =>
      d.patients
        .filter((p) => f.patient === "all" || p.id === f.patient)
        .map((p) => ({ ...p, _date: p.lastVisit, _amount: p.balance, _name: p.name })),
  },
];

export function ReportsClient({
  invoices,
  appointments,
  patients,
  treatments,
  providers,
}: {
  invoices: InvoiceRow[];
  appointments: ApptRow[];
  patients: PatientRow[];
  treatments: TreatmentRow[];
  providers: { id: string; name: string }[];
}) {
  const data: Data = { invoices, appointments, patients, treatments };

  const [reportKey, setReportKey] = React.useState(REPORTS[0].key);
  // filters live here, ABOVE the report type — switching report type never resets them
  const [draft, setDraft] = React.useState<Filters>(DEFAULT_FILTERS);
  const [applied, setApplied] = React.useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = React.useState(true);
  // visible columns per report type
  const [cols, setCols] = React.useState<Record<string, string[]>>(() =>
    Object.fromEntries(REPORTS.map((r) => [r.key, r.columns.map((c) => c.key)]))
  );
  const [addOpen, setAddOpen] = React.useState(false);
  const [dragKey, setDragKey] = React.useState<string | null>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);

  const report = REPORTS.find((r) => r.key === reportKey)!;
  const visibleKeys = cols[reportKey];
  // render in the user's chosen order, not the report's native order
  const visibleCols = visibleKeys
    .map((k) => report.columns.find((c) => c.key === k))
    .filter(Boolean) as Column[];
  const hiddenCols = report.columns.filter((c) => !visibleKeys.includes(c.key));

  const rows = sortRows(report.build(data, applied), applied);

  const set = (patch: Partial<Filters>) => setDraft((p) => ({ ...p, ...patch }));

  function removeCol(key: string) {
    setCols((p) => ({ ...p, [reportKey]: p[reportKey].filter((k) => k !== key) }));
  }
  function addCol(key: string) {
    setCols((p) => ({ ...p, [reportKey]: [...p[reportKey], key] }));
    setAddOpen(false);
  }
  function moveCol(from: string, to: string) {
    if (from === to) return;
    setCols((p) => {
      const arr = [...p[reportKey]];
      const fi = arr.indexOf(from);
      const ti = arr.indexOf(to);
      if (fi < 0 || ti < 0) return p;
      arr.splice(fi, 1);
      arr.splice(ti, 0, from);
      return { ...p, [reportKey]: arr };
    });
  }

  function exportPdf() {
    const win = window.open("", "_blank", "width=980,height=720");
    if (!win || !tableRef.current) return;
    const parts: string[] = [];
    if (applied.from || applied.to) parts.push(`Date: ${applied.from || "…"} – ${applied.to || "…"}`);
    if (applied.provider !== "all") parts.push(`Provider: ${providers.find((p) => p.id === applied.provider)?.name ?? ""}`);
    if (applied.patient !== "all") parts.push(`Patient: ${patients.find((p) => p.id === applied.patient)?.name ?? ""}`);
    if (applied.status !== "all") parts.push(`Status: ${applied.status}`);
    if (applied.mode !== "all") parts.push(`Mode: ${applied.mode}`);
    parts.push(`Sort: ${applied.sortBy} ${applied.sortOrder}`);
    const generated = new Date().toLocaleString("en-GB", { timeZone: "UTC" });
    win.document.write(`<!doctype html><html><head><title>Ivory Dental — ${report.label}</title>
      <style>
        *{box-sizing:border-box} body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#111;margin:32px}
        .brand{font-size:20px;font-weight:700;color:#0d9488}
        h2{margin:2px 0 4px;font-size:16px}
        .meta{color:#666;font-size:12px;margin-bottom:16px}
        .filters{font-size:12px;color:#444;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:8px 12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{text-align:left;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#666;border-bottom:2px solid #ddd;padding:8px}
        td{padding:7px 8px;border-bottom:1px solid #eee}
        td[align=right],th[align=right]{text-align:right}
        footer{margin-top:24px;font-size:11px;color:#999;text-align:center}
        @media print{body{margin:12mm}}
      </style></head><body>
      <div class="brand">🦷 Ivory Dental, Bengaluru</div>
      <h2>${report.label}</h2>
      <div class="meta">${rows.length} rows · Generated ${generated} UTC</div>
      <div class="filters">${parts.join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</div>
      ${tableRef.current.outerHTML}
      <footer>Ivory Dental Suite — confidential</footer>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="space-y-4">
      {/* Report type tabs */}
      <Card className="p-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="px-3 text-xs font-medium text-muted-foreground">Report Type</span>
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setReportKey(r.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                r.key === reportKey ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Filters — persist across report type changes */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="flex w-full items-center gap-2 border-b px-5 py-3 text-sm font-medium hover:bg-accent/40"
        >
          <SlidersHorizontal className="size-4" /> Filters
          {showFilters ? <ChevronUp className="ml-auto size-4" /> : <ChevronDown className="ml-auto size-4" />}
        </button>

        {showFilters && (
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Date From" onClear={draft.from ? () => set({ from: "" }) : undefined}>
                <Input type="date" value={draft.from} onChange={(e) => set({ from: e.target.value })} />
              </Field>
              <Field label="Date To" onClear={draft.to ? () => set({ to: "" }) : undefined}>
                <Input type="date" value={draft.to} onChange={(e) => set({ to: e.target.value })} />
              </Field>
              <Field label="Doctor">
                <SearchableSelect
                  value={draft.provider}
                  onChange={(v) => set({ provider: v })}
                  options={providers.map((p) => ({ value: p.id, label: p.name }))}
                  allLabel="All doctors"
                />
              </Field>
              <Field label="Patient">
                <SearchableSelect
                  value={draft.patient}
                  onChange={(v) => set({ patient: v })}
                  options={patients.map((p) => ({ value: p.id, label: p.name }))}
                  allLabel="All patients"
                />
              </Field>
              <Field label="Status" onClear={draft.status !== "all" ? () => set({ status: "all" }) : undefined}>
                <Select value={draft.status} onChange={(e) => set({ status: e.target.value })} className="w-full">
                  <option value="all">All statuses</option>
                  <optgroup label="Billing">
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="due">Due</option>
                  </optgroup>
                  <optgroup label="Appointments">
                    <option value="booked">Booked</option>
                    <option value="arrived">Arrived</option>
                    <option value="in-consult">In consult</option>
                    <option value="completed">Completed</option>
                    <option value="no-show">No-show</option>
                  </optgroup>
                  <optgroup label="Treatment">
                    <option value="planned">Planned</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </optgroup>
                </Select>
              </Field>
              <Field label="Payment Mode" onClear={draft.mode !== "all" ? () => set({ mode: "all" }) : undefined}>
                <Select value={draft.mode} onChange={(e) => set({ mode: e.target.value })} className="w-full">
                  <option value="all">All modes</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                </Select>
              </Field>
              <Field label="Sort By">
                <Select value={draft.sortBy} onChange={(e) => set({ sortBy: e.target.value as Filters["sortBy"] })} className="w-full">
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="name">Patient name</option>
                </Select>
              </Field>
              <Field label="Sort Order">
                <Select value={draft.sortOrder} onChange={(e) => set({ sortOrder: e.target.value as Filters["sortOrder"] })} className="w-full">
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </Select>
              </Field>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(DEFAULT_FILTERS);
                  setApplied(DEFAULT_FILTERS);
                }}
              >
                Clear all
              </Button>
              <Button onClick={() => setApplied(draft)}>Apply Filters</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Columns chips — drag to reorder, × to remove, + to add */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Columns:</span>
        {visibleCols.map((c) => (
          <span
            key={c.key}
            draggable
            onDragStart={() => setDragKey(c.key)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragKey) moveCol(dragKey, c.key);
              setDragKey(null);
            }}
            onDragEnd={() => setDragKey(null)}
            className={cn(
              "inline-flex cursor-grab items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary active:cursor-grabbing",
              dragKey === c.key && "opacity-40"
            )}
          >
            <GripVertical className="size-3 opacity-50" />
            {c.label}
            <button onClick={() => removeCol(c.key)} className="hover:text-danger" aria-label={`Remove ${c.label}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        {hiddenCols.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setAddOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
            >
              <Plus className="size-3" /> Add
            </button>
            {addOpen && (
              <div className="absolute z-10 mt-1 w-44 rounded-lg border bg-card p-1 shadow-lg">
                {hiddenCols.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => addCol(c.key)}
                    className="block w-full rounded-md px-3 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results — this table is the export preview pane */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium">{report.label}</p>
            <span className="text-xs text-muted-foreground">{rows.length} rows</span>
          </div>
          <Button size="sm" variant="outline" onClick={exportPdf}>
            <FileDown className="size-3.5" /> Export PDF
          </Button>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table ref={tableRef} className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                {visibleCols.map((c) => (
                  <th
                    key={c.key}
                    align={c.align === "right" ? "right" : undefined}
                    className={cn("px-5 py-3 font-medium", c.align === "right" && "text-right")}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={visibleCols.length} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No rows match these filters
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={(r.id as string) ?? i} className="border-b transition-colors last:border-0 hover:bg-accent/50">
                  {visibleCols.map((c) => (
                    <td
                      key={c.key}
                      align={c.align === "right" ? "right" : undefined}
                      className={cn("px-5 py-3", c.align === "right" && "text-right font-semibold tabular-nums")}
                    >
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children, onClear }: { label: string; children: React.ReactNode; onClear?: () => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        {onClear && (
          <button type="button" onClick={onClear} className="text-[10px] font-normal text-primary hover:underline">
            Clear
          </button>
        )}
      </span>
      {children}
    </label>
  );
}

function SearchableSelect({
  value,
  onChange,
  options,
  allLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const all = [{ value: "all", label: allLabel }, ...options];
  const selected = all.find((o) => o.value === value);
  const filtered = all.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn("truncate", value === "all" && "text-muted-foreground")}>{selected?.label ?? allLabel}</span>
        <span className="flex shrink-0 items-center gap-1">
          {value !== "all" && (
            <X
              className="size-3.5 text-muted-foreground hover:text-danger"
              onClick={(e) => {
                e.stopPropagation();
                onChange("all");
              }}
            />
          )}
          <ChevronDown className="size-4 opacity-50" />
        </span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-card p-1 shadow-lg">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="mb-1 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="max-h-56 overflow-y-auto scrollbar-thin">
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQ("");
                }}
                className={cn(
                  "block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                  o.value === value && "bg-accent font-medium"
                )}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">No matches</p>}
          </div>
        </div>
      )}
    </div>
  );
}
