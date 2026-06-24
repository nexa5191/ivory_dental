"use client";

import * as React from "react";
import { RotateCcw, Check } from "lucide-react";
import { useTheme } from "./theme-provider";
import { PRESETS, ThemeMode, hslString } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  trackStyle,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  trackStyle?: React.CSSProperties;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="tabular-nums font-semibold">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="studio-range h-2 w-full cursor-pointer appearance-none rounded-full"
        style={trackStyle}
      />
    </div>
  );
}

export function ColorStudio({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, reset } = useTheme();
  const { hue, saturation, lightness, radius, mode } = theme;

  const hueTrack: React.CSSProperties = {
    background:
      "linear-gradient(to right, hsl(0 80% 55%), hsl(60 80% 55%), hsl(120 80% 55%), hsl(180 80% 55%), hsl(240 80% 55%), hsl(300 80% 55%), hsl(360 80% 55%))",
  };
  const satTrack: React.CSSProperties = {
    background: `linear-gradient(to right, hsl(${hue} 0% ${lightness}%), hsl(${hue} 100% ${lightness}%))`,
  };
  const lightTrack: React.CSSProperties = {
    background: `linear-gradient(to right, hsl(${hue} ${saturation}% 12%), hsl(${hue} ${saturation}% 55%), hsl(${hue} ${saturation}% 92%))`,
  };

  const accent = hslString(hue, saturation, lightness);

  return (
    <div className={cn("space-y-5", compact ? "w-[320px]" : "max-w-md")}>
      <div className="flex items-center gap-3">
        <div
          className="size-12 shrink-0 rounded-xl shadow-inner ring-1 ring-border"
          style={{ background: accent }}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Theme studio</p>
          <p className="truncate text-xs text-muted-foreground">
            Drag to recolor the entire app live
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Slider label="Hue" value={hue} min={0} max={360} onChange={(v) => setTheme({ hue: v })} trackStyle={hueTrack} />
        <Slider label="Saturation" value={saturation} min={0} max={100} onChange={(v) => setTheme({ saturation: v })} trackStyle={satTrack} suffix="%" />
        <Slider label="Lightness" value={lightness} min={20} max={80} onChange={(v) => setTheme({ lightness: v })} trackStyle={lightTrack} suffix="%" />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Corner radius</p>
        <div className="flex gap-1.5">
          {[0, 4, 8, 12, 16].map((r) => (
            <button
              key={r}
              onClick={() => setTheme({ radius: r })}
              className={cn(
                "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
                radius === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Appearance</p>
        <div className="flex gap-1.5">
          {(["light", "dark", "system"] as ThemeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setTheme({ mode: m })}
              className={cn(
                "flex-1 rounded-md border py-1.5 text-xs font-medium capitalize transition-colors",
                mode === m ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = p.hue === hue && p.saturation === saturation && p.lightness === lightness;
            return (
              <button
                key={p.name}
                title={p.name}
                onClick={() => setTheme({ hue: p.hue, saturation: p.saturation, lightness: p.lightness })}
                className={cn(
                  "relative size-8 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                  active ? "ring-foreground" : "ring-transparent"
                )}
                style={{ background: hslString(p.hue, p.saturation, p.lightness) }}
              >
                {active && (
                  <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-lg border bg-background p-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Live preview
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="outline">Outline</Button>
          <Badge>Active</Badge>
          <Badge variant="good">In stock</Badge>
          <div className="flex items-end gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-2.5 rounded-sm"
                style={{
                  height: 8 + i * 5,
                  background: `var(--chart-${i})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-3.5" /> Reset
        </Button>
        <Badge variant="muted" className="font-mono">
          {hue} · {saturation}% · {lightness}%
        </Badge>
      </div>
    </div>
  );
}
