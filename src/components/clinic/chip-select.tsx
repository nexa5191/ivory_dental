"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChipSelect({
  options,
  value,
  onChange,
  tone = "default",
  placeholder = "Add…",
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  tone?: "default" | "danger";
  placeholder?: string;
}) {
  const [custom, setCustom] = React.useState("");
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  const addCustom = () => {
    const v = custom.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setCustom("");
  };

  const activeCls =
    tone === "danger"
      ? "border-transparent bg-danger/10 text-danger"
      : "border-transparent bg-primary/10 text-primary";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active ? activeCls : "hover:bg-accent"
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
      {/* custom additions not in the preset list */}
      {value.filter((v) => !options.includes(v)).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value
            .filter((v) => !options.includes(v))
            .map((v) => (
              <span
                key={v}
                className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", activeCls)}
              >
                {v}
                <button type="button" onClick={() => toggle(v)}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder={placeholder}
          className="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={addCustom}
          className="inline-flex size-8 items-center justify-center rounded-md border hover:bg-accent"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
