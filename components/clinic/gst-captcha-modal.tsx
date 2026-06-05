"use client";

import * as React from "react";
import { Download, X, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type GstRegistrant } from "@/lib/gst";
import { cn } from "@/lib/utils";

// "Auto-fill from GST Portal" — mock of the services.gst.gov.in search flow: shows
// a single-use captcha that must be solved before the registrant details are pulled.
const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCaptcha(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  return s;
}

export function GstCaptchaModal({
  open,
  gstin,
  onClose,
  onResult,
}: {
  open: boolean;
  gstin: string;
  onClose: () => void;
  onResult: (r: GstRegistrant) => void;
}) {
  const [code, setCode] = React.useState("");
  const [entry, setEntry] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // regenerate the captcha whenever the modal opens
  React.useEffect(() => {
    if (open) { setCode(makeCaptcha()); setEntry(""); setError(""); setLoading(false); }
  }, [open]);

  if (!open) return null;

  function refresh() {
    setCode(makeCaptcha()); setEntry(""); setError("");
  }

  function fetchDetails() {
    if (entry.trim().toUpperCase() !== code) {
      setError("Captcha does not match. Try again.");
      setCode(makeCaptcha()); setEntry("");
      return;
    }
    setLoading(true);
    setError("");
    // resolve via the server route (real provider when configured, else mock)
    fetch("/api/gst/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstin }),
    })
      .then((r) => r.json())
      .then((j: { success?: boolean; data?: GstRegistrant; message?: string }) => {
        setLoading(false);
        if (!j.success || !j.data) { setError(j.message || "Lookup failed."); refresh(); return; }
        onResult(j.data);
        onClose();
      })
      .catch(() => { setLoading(false); setError("Lookup failed — try again."); });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Download className="size-4 text-primary" /> Auto-fill from GST Portal
          </p>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">Looking up</p>
        <p className="font-mono text-sm font-semibold tracking-wide">{gstin}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Solve the captcha</span>
          <button onClick={refresh} className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
            <RefreshCw className="size-3" /> Refresh
          </button>
        </div>

        {/* mock captcha image */}
        <div
          className="mt-2 flex h-16 select-none items-center justify-center overflow-hidden rounded-md border"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #0001 0 1px, transparent 1px 9px), repeating-linear-gradient(90deg, #0001 0 1px, transparent 1px 9px)",
            backgroundColor: "#f4f4f5",
          }}
        >
          <div className="relative px-2">
            <span className="font-mono text-2xl font-bold italic tracking-[0.3em] text-zinc-700" style={{ textShadow: "1px 1px 0 #aaa" }}>
              {code.split("").map((ch, i) => (
                <span key={i} style={{ display: "inline-block", transform: `rotate(${((i % 3) - 1) * 12}deg) translateY(${(i % 2) * 3}px)` }}>
                  {ch}
                </span>
              ))}
            </span>
            <span className="pointer-events-none absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 -rotate-6 bg-red-500/70" />
          </div>
        </div>

        <Input
          autoFocus
          value={entry}
          onChange={(e) => { setEntry(e.target.value); if (error) setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") fetchDetails(); }}
          placeholder="Enter captcha text"
          className={cn("mt-2 uppercase tracking-widest", error && "border-danger")}
        />
        {error ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-danger"><AlertCircle className="size-3" /> {error}</p>
        ) : (
          <p className="mt-1 text-[11px] text-muted-foreground">The captcha comes straight from services.gst.gov.in. Each code is single-use.</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={loading || !entry.trim()} onClick={fetchDetails}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Fetch details
          </Button>
        </div>
      </div>
    </div>
  );
}
