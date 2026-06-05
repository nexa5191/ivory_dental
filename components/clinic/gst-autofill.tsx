"use client";

import * as React from "react";
import { Download, Check, AlertCircle, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isValidGstin, GST_PORTAL_SEARCH_URL, type GstRegistrant } from "@/lib/gst";
import { GstCaptchaModal } from "@/components/clinic/gst-captcha-modal";
import { cn } from "@/lib/utils";

// A GSTIN input paired with an "Auto-fill" button that simulates pulling the
// registrant's legal name + address from the GST portal. The parent decides
// which of its own fields to populate via onResult().
export function GstinAutofill({
  value,
  onChange,
  onResult,
  label = "GSTIN",
  required = false,
  hint = "Type a valid GSTIN then click Auto-fill to pull legal name + address from the GST portal.",
}: {
  value: string;
  onChange: (gstin: string) => void;
  onResult: (r: GstRegistrant) => void;
  label?: string;
  required?: boolean;
  hint?: string;
}) {
  const [status, setStatus] = React.useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [modal, setModal] = React.useState(false);

  const valid = isValidGstin(value);

  function autofill() {
    if (!valid) {
      setStatus("error");
      setMessage("Enter a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5).");
      return;
    }
    setStatus("idle");
    setMessage("");
    setModal(true);
  }

  return (
    <div>
      <GstCaptchaModal
        open={modal}
        gstin={value}
        onClose={() => setModal(false)}
        onResult={(r) => {
          onResult(r);
          setStatus("ok");
          setMessage(`${r.legalName} · ${r.stateName} · PAN ${r.pan}`);
        }}
      />
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{label} {required && <span className="text-danger">*</span>}</span>
        <a href={GST_PORTAL_SEARCH_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
          Verify on GST portal <ExternalLink className="size-3" />
        </a>
      </span>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
            if (status !== "idle") {
              setStatus("idle");
              setMessage("");
            }
          }}
          placeholder="29ABCDE1234F1Z5"
          className="font-mono uppercase tracking-wide"
          maxLength={15}
        />
        <button
          type="button"
          onClick={autofill}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
            valid
              ? "border-primary/40 text-primary hover:bg-primary/10"
              : "border-input text-muted-foreground hover:bg-accent"
          )}
        >
          <Download className="size-3.5" />
          Auto-fill
        </button>
      </div>
      {status === "idle" && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      {status !== "idle" && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-[11px]",
            status === "ok" ? "text-success" : status === "error" ? "text-danger" : "text-muted-foreground"
          )}
        >
          {status === "ok" && <Check className="size-3" />}
          {status === "error" && <AlertCircle className="size-3" />}
          {message}
        </p>
      )}
    </div>
  );
}
