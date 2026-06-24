"use client";

import * as React from "react";
import { Download, Check, AlertCircle, Plus, Trash2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isValidGstin, GST_PORTAL_SEARCH_URL, type GstRegistrant } from "@/lib/gst";
import { GstCaptchaModal } from "@/components/clinic/gst-captcha-modal";
import type { GstRegistration } from "@/lib/vendors";
import { cn } from "@/lib/utils";

export function newRegistration(primary = false): GstRegistration {
  return {
    id: `reg-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    gstin: "", pan: "", tradeName: "", legalName: "", label: primary ? "Head Office" : "",
    stateCode: "", address1: "", address2: "", city: "", state: "", pincode: "", primary,
  };
}

// Multi-GSTIN "GSTN & Addresses" editor. Each registration holds a GSTIN plus
// the principal place of business; Auto-fill pulls legal/trade name + address.
export function GstRegistrations({
  value,
  onChange,
  onAutofillPrimary,
}: {
  value: GstRegistration[];
  onChange: (regs: GstRegistration[]) => void;
  onAutofillPrimary?: (reg: Partial<GstRegistration>) => void;
}) {
  function update(id: string, patch: Partial<GstRegistration>) {
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function setPrimary(id: string) {
    onChange(value.map((r) => ({ ...r, primary: r.id === id })));
  }
  function remove(id: string) {
    const left = value.filter((r) => r.id !== id);
    if (left.length && !left.some((r) => r.primary)) left[0].primary = true;
    onChange(left);
  }
  function add() {
    onChange([...value, newRegistration(value.length === 0)]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">GSTN &amp; Addresses</span>
        <a
          href={GST_PORTAL_SEARCH_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          Verify on GST portal <ExternalLink className="size-3" />
        </a>
      </div>

      {value.map((reg) => (
        <RegistrationCard
          key={reg.id}
          reg={reg}
          canRemove={value.length > 1}
          onChange={(patch) => update(reg.id, patch)}
          onMakePrimary={() => setPrimary(reg.id)}
          onRemove={() => remove(reg.id)}
          onAutofilled={(r) => { if (reg.primary) onAutofillPrimary?.(r); }}
        />
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
      >
        <Plus className="size-3.5" /> Add another GSTIN
      </button>
    </div>
  );
}

function RegistrationCard({
  reg,
  canRemove,
  onChange,
  onMakePrimary,
  onRemove,
  onAutofilled,
}: {
  reg: GstRegistration;
  canRemove: boolean;
  onChange: (patch: Partial<GstRegistration>) => void;
  onMakePrimary: () => void;
  onRemove: () => void;
  onAutofilled: (patch: Partial<GstRegistration>) => void;
}) {
  const [status, setStatus] = React.useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = React.useState("");
  const [modal, setModal] = React.useState(false);
  const valid = isValidGstin(reg.gstin);

  function autofill() {
    if (!valid) {
      setStatus("error");
      setMessage("Enter a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5).");
      return;
    }
    setStatus("idle"); setMessage("");
    setModal(true);
  }

  function applyResult(r: GstRegistrant) {
    // fill-empty-only: never clobber a value the user already typed
    const keep = (cur: string, next: string) => (cur?.trim() ? cur : next);
    const patch: Partial<GstRegistration> = {
      gstin: r.gstin,
      pan: keep(reg.pan, r.pan),
      tradeName: keep(reg.tradeName, r.tradeName),
      legalName: r.legalName,
      stateCode: keep(reg.stateCode, r.stateCode),
      state: keep(reg.state, r.stateName),
      city: keep(reg.city, r.city),
      pincode: keep(reg.pincode, r.pincode),
      address1: keep(reg.address1, r.address), // principal place of business
      taxpayerType: r.taxpayerType,
      taxpayerStatus: r.taxpayerStatus,
    };
    onChange(patch);
    onAutofilled(patch);
    setStatus("ok");
    setMessage(`${r.legalName} · ${r.stateName} · PAN ${r.pan}`);
  }

  return (
    <div className={cn("rounded-lg border p-3", reg.primary ? "border-primary/40 bg-primary/[0.03]" : "bg-muted/20")}>
      <GstCaptchaModal open={modal} gstin={reg.gstin} onClose={() => setModal(false)} onResult={applyResult} />
      {/* header: label + primary + remove */}
      <div className="mb-3 flex items-center gap-2">
        <Input
          value={reg.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label (e.g. Head Office)"
          className="h-8 max-w-[200px] text-xs"
        />
        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <input type="radio" checked={reg.primary} onChange={onMakePrimary} className="size-3.5 accent-[var(--primary)]" />
          Primary
        </label>
        {canRemove && (
          <button type="button" onClick={onRemove} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-danger" aria-label="Remove registration">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {/* GSTIN + auto-fill */}
      <RegField label="GSTIN" required>
        <div className="flex gap-2">
          <Input
            value={reg.gstin}
            onChange={(e) => { onChange({ gstin: e.target.value.toUpperCase() }); if (status !== "idle") { setStatus("idle"); setMessage(""); } }}
            placeholder="27AAACF1794M1Z9"
            className="font-mono uppercase tracking-wide"
            maxLength={15}
          />
          <button
            type="button"
            onClick={autofill}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
              valid ? "border-primary/40 text-primary hover:bg-primary/10" : "border-input text-muted-foreground hover:bg-accent"
            )}
          >
            <Download className="size-3.5" /> Auto-fill
          </button>
        </div>
      </RegField>
      {status === "idle" ? (
        <p className="mt-1 text-[11px] text-muted-foreground">Type a valid GSTIN then Auto-fill to pull legal/trade name &amp; the principal place of business.</p>
      ) : (
        <p className={cn("mt-1 flex items-center gap-1 text-[11px]", status === "ok" ? "text-success" : "text-danger")}>
          {status === "ok" && <Check className="size-3" />}
          {status === "error" && <AlertCircle className="size-3" />}
          {message}
        </p>
      )}
      {reg.taxpayerType && (
        <span
          className={cn(
            "mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-medium",
            /SEZ/i.test(reg.taxpayerType)
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : /ISD|input service/i.test(reg.taxpayerType)
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-input bg-muted text-muted-foreground"
          )}
        >
          GST type: {reg.taxpayerType}{reg.taxpayerStatus ? ` · ${reg.taxpayerStatus}` : ""}
          {/SEZ/i.test(reg.taxpayerType) && <span className="font-normal">(billed as SEZ, not B2B)</span>}
        </span>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <RegField label="Trade name">
          <Input value={reg.tradeName} onChange={(e) => onChange({ tradeName: e.target.value })} placeholder="Legal / trade name" />
        </RegField>
        <RegField label="PAN">
          <Input value={reg.pan} onChange={(e) => onChange({ pan: e.target.value.toUpperCase() })} placeholder="AAAAA0000A" className="font-mono uppercase" maxLength={10} />
        </RegField>
      </div>

      <p className="mb-1 mt-3 text-[11px] font-medium text-muted-foreground">Principal place of business</p>
      <div className="space-y-2">
        <Input value={reg.address1} onChange={(e) => onChange({ address1: e.target.value })} placeholder="Address line 1" />
        <Input value={reg.address2} onChange={(e) => onChange({ address2: e.target.value })} placeholder="Address line 2 (suite, floor…)" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input value={reg.city} onChange={(e) => onChange({ city: e.target.value })} placeholder="City" />
          <Input value={reg.state} onChange={(e) => onChange({ state: e.target.value })} placeholder="State" />
          <Input value={reg.stateCode} onChange={(e) => onChange({ stateCode: e.target.value })} placeholder="State code" maxLength={2} className="font-mono" />
          <Input value={reg.pincode} onChange={(e) => onChange({ pincode: e.target.value })} placeholder="PIN" className="font-mono" maxLength={6} />
        </div>
      </div>
    </div>
  );
}

function RegField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
