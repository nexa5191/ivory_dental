"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { UPPER_TEETH, LOWER_TEETH, TOOTH_META, toothLabel, type ToothStatus } from "@/lib/clinic";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUSES = Object.keys(TOOTH_META) as ToothStatus[];

function Tooth({
  n,
  label,
  status,
  selected,
  onClick,
}: {
  n: number;
  label: string;
  status: ToothStatus;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = TOOTH_META[status];
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Tooth ${toothLabel(n)} (FDI ${n}) — ${meta.label}`}
      className={cn(
        "flex h-11 w-7 flex-col items-center justify-end gap-1 rounded-md border text-[10px] font-medium transition-all",
        selected ? "ring-2 ring-ring ring-offset-1" : "hover:bg-accent",
        status === "missing" && "opacity-40"
      )}
    >
      <span
        className="size-4 rounded-sm border"
        style={{ background: status === "healthy" ? "transparent" : meta.color, borderColor: meta.color }}
      />
      <span className="text-muted-foreground">{label}</span>
    </button>
  );
}

// FDI: each arch is two quadrants; render a midline gap between them.
function Row({
  teeth,
  statusOf,
  labelOf,
  selected,
  onSelect,
}: {
  teeth: number[];
  statusOf: (n: number) => ToothStatus;
  labelOf: (n: number) => string;
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  const left = teeth.slice(0, 8);
  const right = teeth.slice(8);
  return (
    <div className="flex justify-center">
      <div className="flex gap-1">
        {left.map((n) => (
          <Tooth key={n} n={n} label={labelOf(n)} status={statusOf(n)} selected={selected === n} onClick={() => onSelect(n)} />
        ))}
      </div>
      <div className="mx-2 w-px self-stretch bg-border" />
      <div className="flex gap-1">
        {right.map((n) => (
          <Tooth key={n} n={n} label={labelOf(n)} status={statusOf(n)} selected={selected === n} onClick={() => onSelect(n)} />
        ))}
      </div>
    </div>
  );
}

export function DentalChart({
  findings,
  procedures,
  onSet,
  onAddWork,
}: {
  findings: Record<number, ToothStatus>;
  procedures: string[];
  onSet: (tooth: number, status: ToothStatus) => void;
  onAddWork: (tooth: number, procedure: string, fee: number, done: boolean) => void;
}) {
  const { currency } = usePrefs();
  const rate = currency.rate || 1;
  const [selected, setSelected] = React.useState<number | null>(null);
  const [numbering, setNumbering] = React.useState<"simple" | "fdi">("simple");
  const statusOf = (n: number) => findings[n] ?? "healthy";
  const labelOf = (n: number) => (numbering === "fdi" ? String(n) : toothLabel(n));

  // per-tooth work entry
  const [proc, setProc] = React.useState(procedures[0] ?? "");
  const [fee, setFee] = React.useState("");
  const [done, setDone] = React.useState(false);

  function select(n: number) {
    setSelected(n);
    setProc(procedures[0] ?? "");
    setFee("");
    setDone(false);
  }

  function logWork() {
    if (selected === null || !proc.trim()) return;
    // fee is typed in the active currency → store as base so it displays as typed
    onAddWork(selected, proc.trim(), (parseFloat(fee) || 0) / rate, done);
    setFee("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Upper</span> / Lower arch
        </div>
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setNumbering("simple")}
            className={cn("rounded-md px-2.5 py-1 font-medium", numbering === "simple" ? "bg-card shadow-sm" : "text-muted-foreground")}
            title="Upper/Lower · Right/Left"
          >
            UR / UL / LR / LL
          </button>
          <button
            type="button"
            onClick={() => setNumbering("fdi")}
            className={cn("rounded-md px-2.5 py-1 font-medium", numbering === "fdi" ? "bg-card shadow-sm" : "text-muted-foreground")}
          >
            FDI
          </button>
        </div>
      </div>

      <div className="space-y-3 overflow-x-auto rounded-lg border bg-muted/20 p-3 scrollbar-thin">
        <div className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">Upper</span>
          <Row teeth={UPPER_TEETH} statusOf={statusOf} labelOf={labelOf} selected={selected} onSelect={select} />
        </div>
        <div className="mx-auto h-px w-3/4 bg-border" />
        <div className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">Lower</span>
          <Row teeth={LOWER_TEETH} statusOf={statusOf} labelOf={labelOf} selected={selected} onSelect={select} />
        </div>
      </div>

      {numbering === "simple" && (
        <p className="text-center text-[11px] text-muted-foreground">
          UR Upper-Right · UL Upper-Left · LR Lower-Right · LL Lower-Left · 1 (front) → 8 (back)
        </p>
      )}

      {selected !== null ? (
        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">
            Tooth {toothLabel(selected)} <span className="text-xs font-normal text-muted-foreground">(FDI {selected})</span>
          </p>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Finding</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSet(selected, s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    statusOf(selected) === s ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                  )}
                >
                  <span className="size-2.5 rounded-sm" style={{ background: TOOTH_META[s].color }} />
                  {TOOTH_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* log work done + fee → adds to the treatment plan */}
          <div className="border-t pt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Log work &amp; fee for this tooth</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                list="tooth-procedures"
                value={proc}
                onChange={(e) => setProc(e.target.value)}
                placeholder="Procedure"
                className="min-w-[10rem] flex-1"
              />
              <Input
                type="number"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder={`Fee (${currency.symbol})`}
                className="w-28"
              />
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={(e) => setDone(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                Done
              </label>
              <Button size="sm" onClick={logWork} disabled={!proc.trim()}>
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
            <datalist id="tooth-procedures">
              {procedures.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">Click a tooth to record a finding or log work</p>
      )}

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {STATUSES.filter((s) => s !== "healthy").map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2.5 rounded-sm" style={{ background: TOOTH_META[s].color }} />
            {TOOTH_META[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
