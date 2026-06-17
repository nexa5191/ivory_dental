"use client";

import * as React from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { VENDOR_CATEGORIES, type VendorCategory } from "@/lib/vendors";
import { GstinAutofill } from "@/components/clinic/gst-autofill";

export function VendorRegisterClient({ token, inviteEmail, invitePhone }: { token: string; inviteEmail: string; invitePhone: string }) {
  const [form, setForm] = React.useState({
    name: "", category: VENDOR_CATEGORIES[0] as VendorCategory, contact: "",
    email: inviteEmail, phone: invitePhone, city: "", gstin: "", pan: "",
    msme: false, udyam: "",
    bank: { accountName: "", accountNumber: "", ifsc: "", bankName: "", branch: "" },
  });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [done, setDone] = React.useState(false);

  const set = (patch: Partial<typeof form>) => setForm((p) => ({ ...p, ...patch }));
  const setBank = (patch: Partial<typeof form.bank>) => setForm((p) => ({ ...p, bank: { ...p.bank, ...patch } }));

  async function submit() {
    if (!form.name.trim()) { setErr("Company name is required."); return; }
    setBusy(true); setErr("");
    const res = await fetch(`/api/vendors/register/${token}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(j.error || "Could not submit. Try again."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <p className="mt-3 text-base font-semibold">Thanks, {form.name}!</p>
        <p className="mt-1 text-sm text-muted-foreground">Your details have been submitted to Ivory Dental&apos;s procurement team. We&apos;ll reach out shortly.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <p className="text-base font-semibold">Register as a vendor</p>
      <p className="mb-4 text-sm text-muted-foreground">Fill in your business details. Use Auto-fill to pull your GST registration data.</p>

      <div className="space-y-4">
        <Field label="Company name *">
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. DentMart Supplies Pvt Ltd" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.category} onChange={(e) => set({ category: e.target.value as VendorCategory })} className="w-full">
              {VENDOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Contact person">
            <Input value={form.contact} onChange={(e) => set({ contact: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="sales@vendor.in" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 …" />
          </Field>
        </div>

        <GstinAutofill
          value={form.gstin}
          onChange={(g) => set({ gstin: g })}
          onResult={(r) => set({ gstin: r.gstin, pan: form.pan.trim() ? form.pan : r.pan, city: form.city.trim() ? form.city : r.city, name: form.name.trim() ? form.name : r.tradeName })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="PAN">
            <Input value={form.pan} onChange={(e) => set({ pan: e.target.value.toUpperCase() })} placeholder="AAAAA0000A" className="font-mono uppercase" maxLength={10} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
        </div>

        {/* MSME */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.msme} onChange={(e) => set({ msme: e.target.checked })} className="size-4 rounded border-input accent-[hsl(var(--primary))]" />
            We are registered under MSME (Udyam)
          </label>
          {form.msme && (
            <div className="mt-3">
              <Field label="Udyam Registration Number">
                <Input value={form.udyam} onChange={(e) => set({ udyam: e.target.value.toUpperCase() })} placeholder="UDYAM-KR-03-0001234" className="font-mono uppercase" />
              </Field>
            </div>
          )}
        </div>

        {/* Bank */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Banking details (for payments)</p>
          <div className="space-y-3">
            <Field label="Account holder name">
              <Input value={form.bank.accountName} onChange={(e) => setBank({ accountName: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Account number">
                <Input value={form.bank.accountNumber} onChange={(e) => setBank({ accountNumber: e.target.value })} className="font-mono" />
              </Field>
              <Field label="IFSC">
                <Input value={form.bank.ifsc} onChange={(e) => setBank({ ifsc: e.target.value.toUpperCase() })} placeholder="HDFC0000123" className="font-mono uppercase" maxLength={11} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bank name">
                <Input value={form.bank.bankName} onChange={(e) => setBank({ bankName: e.target.value })} />
              </Field>
              <Field label="Branch">
                <Input value={form.bank.branch} onChange={(e) => setBank({ branch: e.target.value })} />
              </Field>
            </div>
          </div>
        </div>

        {err && <p className="flex items-center gap-1 text-xs text-danger"><AlertCircle className="size-3.5" /> {err}</p>}

        <Button className="w-full" disabled={busy || !form.name.trim()} onClick={submit}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Submit registration
        </Button>
      </div>
    </Card>
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
