import { Badge } from "@/components/ui/badge";
import type { ApptStatus, ApptType } from "@/lib/clinic";
import { Video, Phone, Building2 } from "lucide-react";

export const STATUS_META: Record<ApptStatus, { label: string; variant: "good" | "low" | "out" | "default" | "muted" }> = {
  booked: { label: "Booked", variant: "muted" },
  arrived: { label: "Arrived", variant: "default" },
  "in-consult": { label: "In consult", variant: "low" },
  completed: { label: "Completed", variant: "good" },
  "no-show": { label: "No-show", variant: "out" },
};

export const STATUS_FLOW: ApptStatus[] = ["booked", "arrived", "in-consult", "completed"];

export function StatusBadge({ status }: { status: ApptStatus }) {
  const m = STATUS_META[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export function TypeIcon({ type, className }: { type: ApptType; className?: string }) {
  const Icon = type === "video" ? Video : type === "phone" ? Phone : Building2;
  return <Icon className={className} />;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}
