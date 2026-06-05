"use client";

import { Check } from "lucide-react";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { APP_FONTS } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function FontSetting() {
  const { font, setFont } = usePrefs();

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Font</p>
      <div className="grid grid-cols-2 gap-2">
        {APP_FONTS.map((f) => {
          const active = font === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFont(f.key)}
              style={{ fontFamily: f.value }}
              className={cn(
                "rounded-lg border p-3 text-left transition-all",
                active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">{f.label}</span>
                {active && <Check className="size-4 text-primary" />}
              </div>
              <p className="mt-0.5 text-lg leading-tight">Ag 0–9</p>
              {f.note && (
                <p className="mt-1 text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-inter)" }}>
                  {f.note}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
