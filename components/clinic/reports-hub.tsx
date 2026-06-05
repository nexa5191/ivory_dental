"use client";

import * as React from "react";
import { BarChart3, Landmark } from "lucide-react";
import { ReportsClient } from "./reports-client";
import { TaxClient } from "./tax-client";
import { cn } from "@/lib/utils";

type View = "operational" | "tax";

// Top-level switch on the Reports page: operational reporting (collections,
// outstanding, appointments, ledger…) vs tax reporting (GST returns, TDS, recon).
export function ReportsHub({
  operational,
  tax,
  initialView = "operational",
}: {
  operational: React.ComponentProps<typeof ReportsClient>;
  tax: React.ComponentProps<typeof TaxClient>;
  initialView?: View;
}) {
  const [view, setView] = React.useState<View>(initialView);

  const tabs: { k: View; label: string; icon: typeof BarChart3 }[] = [
    { k: "operational", label: "Operational reports", icon: BarChart3 },
    { k: "tax", label: "Tax reports", icon: Landmark },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => setView(t.k)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                view === t.k ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-input bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {view === "operational" ? <ReportsClient {...operational} /> : <TaxClient {...tax} />}
    </div>
  );
}
