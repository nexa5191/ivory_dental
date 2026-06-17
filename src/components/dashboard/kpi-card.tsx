import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger";
}

export function KpiCard({ label, value, delta, hint, icon: Icon, tone = "default" }: KpiCardProps) {
  const toneRing = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/10 text-danger",
  }[tone];

  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex size-9 items-center justify-center rounded-lg", toneRing)}>
          <Icon className="size-[18px]" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              delta.positive ? "text-success" : "text-danger"
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {delta.value}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
