"use client";

import * as React from "react";
import { MapPin, Phone, Mail, UserCog, Armchair, Clock, Pencil, Users, CalendarDays, Plus } from "lucide-react";
import type { Location } from "@/lib/clinic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";

interface LocRow extends Location {
  patients: number;
  apptsToday: number;
  outstanding: number;
}

export function LocationsClient({ locations }: { locations: LocRow[] }) {
  const [rows, setRows] = React.useState<LocRow[]>(locations);
  const [editing, setEditing] = React.useState<LocRow | null>(null);
  const [adding, setAdding] = React.useState(false);

  async function save(id: string, patch: Partial<Location>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setEditing(null);
    await fetch(`/api/locations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function create(input: Partial<Location>) {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Could not add branch." }));
      return error as string;
    }
    const created: Location = await res.json();
    setRows((prev) => [...prev, { ...created, patients: 0, apptsToday: 0, outstanding: 0 }]);
    setAdding(false);
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add location
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {rows.map((l) => (
          <Card key={l.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </span>
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.city}</p>
                </div>
              </div>
              <Badge variant={l.active ? "good" : "muted"}>{l.active ? "Active" : "Inactive"}</Badge>
            </div>

            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" /> {l.address}
            </p>

            <div className="mt-3 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-3.5 shrink-0" /> {l.phone}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" /> {l.email}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <UserCog className="size-3.5 shrink-0" /> {l.lead}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Armchair className="size-3.5 shrink-0" /> {l.chairs} chairs · GSTIN {l.gstin}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5 shrink-0" /> {l.openHours}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
              <Stat icon={<Users className="size-3.5" />} label="Patients" value={String(l.patients)} />
              <Stat icon={<CalendarDays className="size-3.5" />} label="Appts" value={String(l.apptsToday)} />
              <Stat label="Dues" value={<Money value={l.outstanding} compact />} />
            </div>

            <Button variant="outline" className="mt-4 w-full" onClick={() => setEditing(l)}>
              <Pencil className="size-3.5" /> Edit details
            </Button>
          </Card>
        ))}
      </div>

      <EditLocationSheet location={editing} onClose={() => setEditing(null)} onSave={save} />
      <AddLocationSheet open={adding} onClose={() => setAdding(false)} onCreate={create} />
    </div>
  );
}

function AddLocationSheet({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: Partial<Location>) => Promise<string | null>;
}) {
  const empty: Partial<Location> = {
    name: "",
    city: "Bengaluru",
    address: "",
    phone: "",
    email: "",
    lead: "",
    gstin: "",
    chairs: 2,
    openHours: "Mon–Sat · 9:00 AM – 8:00 PM",
    active: true,
  };
  const [form, setForm] = React.useState<Partial<Location>>(empty);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(empty);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch: Partial<Location>) => setForm((p) => ({ ...p, ...patch }));

  async function submit() {
    if (!form.name?.trim()) {
      setError("Branch name is required.");
      return;
    }
    setSaving(true);
    const err = await onCreate(form);
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add location"
      description="Register a new clinic branch"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !form.name?.trim()}>
            {saving ? "Adding…" : "Add location"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Branch name">
            <Input autoFocus placeholder="HSR Layout" value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={form.city ?? ""} onChange={(e) => set({ city: e.target.value })} />
          </Field>
        </div>
        <Field label="Address">
          <Input placeholder="Street, area, landmark" value={form.address ?? ""} onChange={(e) => set({ address: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <Input value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lead dentist">
            <Input value={form.lead ?? ""} onChange={(e) => set({ lead: e.target.value })} />
          </Field>
          <Field label="GSTIN">
            <Input value={form.gstin ?? ""} onChange={(e) => set({ gstin: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Chairs">
            <Input
              type="number"
              min="1"
              value={String(form.chairs ?? 1)}
              onChange={(e) => set({ chairs: Number(e.target.value) })}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.active ? "active" : "inactive"}
              onChange={(e) => set({ active: e.target.value === "active" })}
              className="w-full"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
        <Field label="Opening hours">
          <Input value={form.openHours ?? ""} onChange={(e) => set({ openHours: e.target.value })} />
        </Field>
      </div>
    </Sheet>
  );
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EditLocationSheet({
  location,
  onClose,
  onSave,
}: {
  location: LocRow | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Location>) => void;
}) {
  const [form, setForm] = React.useState<Partial<Location>>({});

  React.useEffect(() => {
    if (location) {
      const { patients, apptsToday, outstanding, ...rest } = location;
      void patients;
      void apptsToday;
      void outstanding;
      setForm(rest);
    }
  }, [location]);

  const set = (patch: Partial<Location>) => setForm((p) => ({ ...p, ...patch }));

  return (
    <Sheet
      open={!!location}
      onClose={onClose}
      title={location ? `Edit ${location.name}` : undefined}
      description="Update branch address & contact details"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => location && onSave(location.id, form)}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Address">
          <Input value={form.address ?? ""} onChange={(e) => set({ address: e.target.value })} />
        </Field>
        <Field label="City">
          <Input value={form.city ?? ""} onChange={(e) => set({ city: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <Input value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lead dentist">
            <Input value={form.lead ?? ""} onChange={(e) => set({ lead: e.target.value })} />
          </Field>
          <Field label="GSTIN">
            <Input value={form.gstin ?? ""} onChange={(e) => set({ gstin: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Chairs">
            <Input
              type="number"
              min="1"
              value={String(form.chairs ?? 1)}
              onChange={(e) => set({ chairs: Number(e.target.value) })}
            />
          </Field>
          <Field label="Status">
            <Select value={form.active ? "active" : "inactive"} onChange={(e) => set({ active: e.target.value === "active" })} className="w-full">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
        <Field label="Opening hours">
          <Input value={form.openHours ?? ""} onChange={(e) => set({ openHours: e.target.value })} />
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
