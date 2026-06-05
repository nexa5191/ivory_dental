"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  IndianRupee,
  Users,
  UserX,
  DollarSign,
  Boxes,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { FlipCard } from "@/components/ui/flip-card";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";

// Icon registry — server pages pass a string key (functions can't cross the
// server→client boundary).
const ICONS = {
  calendar: CalendarDays,
  rupee: IndianRupee,
  users: Users,
  userx: UserX,
  dollar: DollarSign,
  boxes: Boxes,
  alert: AlertTriangle,
  truck: Truck,
} as const;

export type KpiIcon = keyof typeof ICONS;

export interface KpiFlipProps {
  label: string;
  value: React.ReactNode;
  icon: KpiIcon;
  tone?: "default" | "warning" | "danger";
  spark?: number[];
  delta?: { value: string; positive: boolean };
  hint?: string;
  back: { title: string; rows: { label: string; value: React.ReactNode }[]; href: string; hrefLabel: string };
}

export function KpiFlip({ label, value, icon, tone = "default", spark, delta, hint, back }: KpiFlipProps) {
  const Icon = ICONS[icon] ?? CalendarDays;
  const toneCls = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/10 text-danger",
  }[tone];
  const sparkStroke =
    tone === "warning" ? "hsl(var(--warning))" : tone === "danger" ? "hsl(var(--danger))" : "hsl(var(--primary))";

  return (
    <FlipCard
      height="h-32"
      front={
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className={cn("flex size-7 items-center justify-center rounded-lg", toneCls)}>
              <Icon className="size-3.5" />
            </div>
          </div>
          <p className="mt-0.5 text-2xl font-bold leading-tight tracking-tight tabular-nums">{value}</p>
          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              {delta && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-semibold",
                    delta.positive ? "text-success" : "text-danger"
                  )}
                >
                  {delta.positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  {delta.value}
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
            {spark && spark.length > 1 && <Sparkline data={spark} stroke={sparkStroke} className="h-7 w-20" />}
          </div>
        </div>
      }
      back={
        <div className="flex h-full flex-col p-3.5">
          <p className="text-sm font-semibold">{back.title}</p>
          <div className="mt-1.5 space-y-1">
            {back.rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
          <Link
            href={back.href}
            className="mt-auto inline-flex w-fit items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {back.hrefLabel} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      }
    />
  );
}
