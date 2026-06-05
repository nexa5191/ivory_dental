"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Star, Plus, BadgeCheck, Power, Pencil, Link2, Check, Search, Package, Download, AlertCircle } from "lucide-react";
import type { Vendor, VendorCategory } from "@/lib/vendors";
import { VENDOR_CATEGORIES } from "@/lib/vendors";

export interface InventorySupplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  rating: number;
  products: number;
}
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { GstRegistrations, newRegistration } from "@/components/clinic/gst-registrations";
import type { GstRegistration } from "@/lib/vendors";
import { TDS_SECTIONS, tdsSectionRate } from "@/lib/gst";
import { cn } from "@/lib/utils";

export function VendorsClient({
  vendors,
  inventorySuppliers = [],
}: {
  vendors: Vendor[];
  inventorySuppliers?: InventorySupplier[];
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const [editing, setEditing] = React.useState<Vendor | null>(null);
  const [filter, setFilter] = React.useState<"all" | VendorCategory>("all");
  const [query, setQuery] = React.useState("");
  const [importingId, setImportingId] = React.useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const matchesQuery = (...fields: string[]) =>
    !q || fields.some((f) => f?.toLowerCase().includes(q));

  const shown = vendors.filter(
    (v) =>
      (filter === "all" || v.category === filter) &&
      matchesQuery(v.name, v.contact, v.email, v.city, v.category)
  );

  // inventory suppliers not already in the vendor master, matching the search
  const vendorNames = new Set(vendors.map((v) => v.name.toLowerCase()));
  const invMatches = inventorySuppliers.filter(
    (s) => !vendorNames.has(s.name.toLowerCase()) && matchesQuery(s.name, s.contact, s.email)
  );

  async function toggleActive(v: Vendor) {
    await fetch(`/api/vendors/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !v.active }),
    });
    router.refresh();
  }

  async function importSupplier(s: InventorySupplier) {
    setImportingId(s.id);
    await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: s.name,
        contact: s.contact,
        email: s.email,
        rating: s.rating,
        category: "Consumables",
      }),
    });
    setImportingId(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search vendors & inventory suppliers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setInviting(true)}>
            <Link2 className="size-4" /> Invite vendor
          </Button>
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Register vendor
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {VENDOR_CATEGORIES.map((c) => (
            <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((v) => (
          <Card key={v.id} className={cn("p-5", !v.active && "opacity-60")}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                  {v.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.contact || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5" fill={i < v.rating ? "currentColor" : "none"} />
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge>{v.category}</Badge>
              <Badge variant={v.active ? "good" : "muted"}>{v.active ? "Active" : "Inactive"}</Badge>
              {v.msme && <Badge variant="good">MSME</Badge>}
            </div>

            <div className="mt-4 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" /> {v.email || "—"}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-3.5 shrink-0" /> {v.phone || "—"}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" /> {v.city || "—"}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <BadgeCheck className="size-3.5 shrink-0" /> GSTIN {v.gstin || "—"}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(v)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <CopyLinkButton token={v.token} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleActive(v)}
                title={v.active ? "Deactivate" : "Activate"}
              >
                <Power className="size-4" />
              </Button>
            </div>
          </Card>
        ))}
        {shown.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            {q ? "No vendors match your search." : "No vendors in this category yet."}
          </p>
        )}
      </div>

      {/* Inventory suppliers — the procurement-side vendor master is searchable
          alongside the inventory module's supplier list. */}
      {invMatches.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Inventory suppliers
            </h2>
            <span className="text-xs text-muted-foreground">· from the inventory module · not yet in vendor master</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {invMatches.map((s) => (
              <Card key={s.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground">
                      {s.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.contact || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5" fill={i < s.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" /> {s.email || "—"}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Package className="size-3.5 shrink-0" /> {s.products} linked product{s.products !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => importSupplier(s)}
                  disabled={importingId === s.id}
                >
                  <Download className="size-3.5" />
                  {importingId === s.id ? "Adding…" : "Add to vendor master"}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <InviteVendorSheet open={inviting} onClose={() => setInviting(false)} />

      <VendorSheet
        open={adding || !!editing}
        vendor={editing}
        allVendors={vendors}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSaved={() => {
          setAdding(false);
          setEditing(null);
          router.refresh();
        }}
      />
    </>
  );
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = React.useState(false);

  function copy() {
    const url = `${window.location.origin}/vendor-portal/${token}`;
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => {
        window.prompt("Vendor portal link", url);
      }
    );
  }

  return (
    <Button variant="outline" size="icon" onClick={copy} title="Copy vendor portal link">
      {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
    </Button>
  );
}

function FilterChip({
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
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

type VendorForm = {
  name: string;
  category: VendorCategory;
  contact: string;
  email: string;
  phone: string;
  rating: number;
  active: boolean;
  registrations: GstRegistration[];
  msme: boolean;
  udyam: string;
  bank: { accountName: string; accountNumber: string; ifsc: string; bankName: string; branch: string };
  tds: { applicable: boolean; section: string; rate: number };
};

const EMPTY_BANK = { accountName: "", accountNumber: "", ifsc: "", bankName: "", branch: "" };

function InviteVendorSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [link, setLink] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) { setEmail(""); setPhone(""); setNote(""); setLink(""); setCopied(false); }
  }, [open]);

  async function generate() {
    setBusy(true);
    const res = await fetch("/api/vendors/invites", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, note }),
    });
    const inv = await res.json();
    setBusy(false);
    setLink(`${window.location.origin}/vendor-register/${inv.token}`);
  }

  function copy() {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const channels = [email && "email", phone && "SMS"].filter(Boolean).join(" & ");

  return (
    <Sheet open={open} onClose={onClose} title="Invite a vendor" description="Send a self-registration link — the vendor fills in their own details.">
      <div className="space-y-4">
        {!link ? (
          <>
            <Field label="Vendor email (optional)">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sales@vendor.in" />
            </Field>
            <Field label="Vendor phone (optional)">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
            </Field>
            <Field label="Note (optional)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. for orthodontic consumables" />
            </Field>
            <Button className="w-full" onClick={generate} disabled={busy}>
              {busy ? "Generating…" : "Generate invite link"}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-lg border bg-success/10 p-3 text-sm text-success">
              <Check className="mr-1 inline size-4" />
              Invite created{channels ? ` — sent via ${channels} (mock)` : ""}.
            </div>
            <Field label="Registration link">
              <div className="flex gap-2">
                <Input readOnly value={link} className="font-mono text-xs" />
                <Button variant="outline" onClick={copy}>{copied ? <Check className="size-4" /> : "Copy"}</Button>
              </div>
            </Field>
            <p className="text-xs text-muted-foreground">Share this link with the vendor. They&apos;ll fill in their details (with GSTIN auto-fill) and register themselves.</p>
            <Button variant="outline" className="w-full" onClick={() => setLink("")}>Create another invite</Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

function VendorSheet({
  open,
  vendor,
  allVendors,
  onClose,
  onSaved,
}: {
  open: boolean;
  vendor: Vendor | null;
  allVendors: Vendor[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!vendor;
  const empty: VendorForm = {
    name: "",
    category: VENDOR_CATEGORIES[0],
    contact: "",
    email: "",
    phone: "",
    rating: 4,
    active: true,
    registrations: [newRegistration(true)],
    msme: false,
    udyam: "",
    bank: { ...EMPTY_BANK },
    tds: { applicable: false, section: "194C", rate: 2 },
  };
  const [form, setForm] = React.useState<VendorForm>(empty);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (vendor) {
      // existing registrations, or one synthesised from the legacy single GSTIN
      const regs: GstRegistration[] = vendor.registrations?.length
        ? vendor.registrations.map((r) => ({ ...r }))
        : [{
            ...newRegistration(true),
            gstin: vendor.gstin ?? "",
            pan: vendor.pan ?? "",
            tradeName: vendor.name,
            city: vendor.city ?? "",
          }];
      setForm({
        name: vendor.name,
        category: vendor.category,
        contact: vendor.contact,
        email: vendor.email,
        phone: vendor.phone,
        rating: vendor.rating,
        active: vendor.active,
        registrations: regs,
        msme: vendor.msme ?? false,
        udyam: vendor.udyam ?? "",
        bank: { ...EMPTY_BANK, ...(vendor.bank ?? {}) },
        tds: vendor.tds
          ? { applicable: true, section: vendor.tds.section, rate: vendor.tds.rate }
          : { applicable: false, section: "194C", rate: 2 },
      });
    } else {
      setForm(empty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vendor]);

  const set = (patch: Partial<VendorForm>) => setForm((p) => ({ ...p, ...patch }));
  const setBank = (patch: Partial<VendorForm["bank"]>) => setForm((p) => ({ ...p, bank: { ...p.bank, ...patch } }));
  const setTds = (patch: Partial<VendorForm["tds"]>) => setForm((p) => ({ ...p, tds: { ...p.tds, ...patch } }));

  // ── PAN / GSTIN de-duplication (1 vendor : 1 PAN) ──
  const norm = (s: string) => s.trim().toUpperCase();
  const filledRegs = form.registrations.filter((r) => norm(r.gstin));
  const distinctPans = Array.from(new Set(filledRegs.map((r) => norm(r.pan)).filter(Boolean)));
  const panMismatch = distinctPans.length > 1; // all GSTINs of one vendor share a PAN
  const myPan = distinctPans[0] ?? "";
  // duplicate GSTIN within this vendor
  const gstins = filledRegs.map((r) => norm(r.gstin));
  const dupGstin = gstins.find((g, i) => gstins.indexOf(g) !== i) ?? "";
  // PAN (or any GSTIN) already registered to a different vendor
  const clashVendor = allVendors.find((v) => {
    if (vendor && v.id === vendor.id) return false;
    const vPans = new Set<string>();
    const vGstins = new Set<string>();
    if (v.pan) vPans.add(norm(v.pan));
    if (v.gstin) vGstins.add(norm(v.gstin));
    (v.registrations ?? []).forEach((r) => { if (r.pan) vPans.add(norm(r.pan)); if (r.gstin) vGstins.add(norm(r.gstin)); });
    return (myPan && vPans.has(myPan)) || gstins.some((g) => vGstins.has(g));
  });
  const dupError = panMismatch
    ? "All GSTINs of a vendor must belong to the same PAN."
    : dupGstin
      ? `GSTIN ${dupGstin} is entered more than once.`
      : clashVendor
        ? `This PAN / GSTIN is already registered to “${clashVendor.name}”.`
        : "";

  async function save() {
    if (!form.name.trim() || dupError) return;
    setSaving(true);
    const primary = form.registrations.find((r) => norm(r.gstin) && r.primary) ?? filledRegs[0];
    const payload = {
      ...form,
      registrations: form.registrations.filter((r) => norm(r.gstin)),
      gstin: primary?.gstin ?? "",
      pan: primary?.pan ?? "",
      city: primary?.city ?? "",
      tds: form.tds.applicable ? { section: form.tds.section, rate: form.tds.rate } : null,
    };
    if (isEdit) {
      await fetch(`/api/vendors/${vendor!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${vendor!.name}` : "Register vendor"}
      description={isEdit ? "Update vendor details" : "Add a supplier to the vendor master"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.name.trim() || !!dupError}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Register vendor"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Vendor name">
          <Input autoFocus placeholder="DentMart Supplies" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Category">
          <Select value={form.category} onChange={(e) => set({ category: e.target.value as VendorCategory })} className="w-full">
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact person">
            <Input value={form.contact} onChange={(e) => set({ contact: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input placeholder="+91 …" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="email" placeholder="sales@vendor.in" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Rating">
            <Select value={String(form.rating)} onChange={(e) => set({ rating: Number(e.target.value) })} className="w-full">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? "s" : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* GSTN & Addresses — multi-GSTIN with auto-fill */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <GstRegistrations
            value={form.registrations}
            onChange={(regs) => set({ registrations: regs })}
            onAutofillPrimary={(r) => { if (!form.name.trim() && r.tradeName) set({ name: r.tradeName }); }}
          />
          {dupError && (
            <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-danger">
              <AlertCircle className="size-3" /> {dupError}
            </p>
          )}
        </div>

        {/* MSME / Udyam */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.msme}
              onChange={(e) => set({ msme: e.target.checked })}
              className="size-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            Registered under MSME (Udyam)
          </label>
          {form.msme && (
            <div className="mt-3">
              <Field label="Udyam Registration Number">
                <Input
                  value={form.udyam}
                  onChange={(e) => set({ udyam: e.target.value.toUpperCase() })}
                  placeholder="UDYAM-KR-03-0001234"
                  className="font-mono uppercase"
                />
              </Field>
              <p className="mt-1 text-[11px] text-muted-foreground">
                MSME suppliers must be paid within 45 days under the MSMED Act.
              </p>
            </div>
          )}
        </div>

        {/* Banking details */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Banking details</p>
          <div className="space-y-3">
            <Field label="Account holder name">
              <Input value={form.bank.accountName} onChange={(e) => setBank({ accountName: e.target.value })} placeholder="As per bank records" />
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
                <Input value={form.bank.bankName} onChange={(e) => setBank({ bankName: e.target.value })} placeholder="HDFC Bank" />
              </Field>
              <Field label="Branch">
                <Input value={form.bank.branch} onChange={(e) => setBank({ branch: e.target.value })} />
              </Field>
            </div>
          </div>
        </div>

        {/* TDS */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.tds.applicable}
              onChange={(e) => setTds({ applicable: e.target.checked })}
              className="size-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            Deduct TDS on payments (Form 26Q)
          </label>
          {form.tds.applicable && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="TDS section">
                <Select
                  value={form.tds.section}
                  onChange={(e) => setTds({ section: e.target.value, rate: tdsSectionRate(e.target.value) })}
                  className="w-full"
                >
                  {TDS_SECTIONS.map((s) => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="TDS rate (%)">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.tds.rate}
                  onChange={(e) => setTds({ rate: Number(e.target.value) })}
                />
              </Field>
            </div>
          )}
        </div>

        {isEdit && (
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
        )}
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
