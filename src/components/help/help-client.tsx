"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ArrowRight,
  Rocket,
  CalendarDays,
  Users,
  Receipt,
  Store,
  Boxes,
  FolderOpen,
  BarChart3,
  Settings,
  LifeBuoy,
  Sparkles,
  X,
} from "lucide-react";
import type { HelpTask, HelpCategory } from "@/lib/help";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ICON: Record<HelpCategory["icon"], React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  calendar: CalendarDays,
  users: Users,
  receipt: Receipt,
  store: Store,
  boxes: Boxes,
  folder: FolderOpen,
  chart: BarChart3,
  settings: Settings,
};

const SUGGESTIONS = ["reschedule", "GRN", "free stock", "write-off", "financial year", "vendor portal"];

export function HelpClient({
  categories,
  tasks,
}: {
  categories: HelpCategory[];
  tasks: HelpTask[];
}) {
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState<string>("all");
  const [open, setOpen] = React.useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const matches = (t: HelpTask) =>
    !q ||
    t.title.toLowerCase().includes(q) ||
    t.summary.toLowerCase().includes(q) ||
    (t.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
    t.steps.some((s) => s.toLowerCase().includes(q));

  const countFor = (key: string) => tasks.filter((t) => t.category === key).length;

  const filtered = tasks.filter((t) => (searching ? matches(t) : cat === "all" || t.category === cat));

  // when searching, ignore the category filter and group across everything
  const visibleCats = searching ? categories : cat === "all" ? categories : categories.filter((c) => c.key === cat);
  const grouped = visibleCats
    .map((c) => ({ cat: c, items: filtered.filter((t) => t.category === c.key) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="animate-fade-in space-y-8">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-10">
        <div
          className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <LifeBuoy className="size-3.5 text-primary" /> Help &amp; how-to
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">How can we help?</h1>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Task-by-task guides for every part of the Ivory Dental Suite.
          </p>

          <div className="relative mx-auto mt-5 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              className="h-12 rounded-xl pl-12 pr-10 text-base shadow-sm"
              placeholder="Search guides…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {!searching && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-xs text-muted-foreground">Popular:</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full border bg-card px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* mobile category chips */}
      {!searching && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
          <MobileChip active={cat === "all"} onClick={() => setCat("all")}>
            All
          </MobileChip>
          {categories.map((c) => (
            <MobileChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
              {c.label}
            </MobileChip>
          ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* sticky category rail (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            <RailButton active={!searching && cat === "all"} onClick={() => setCat("all")} count={tasks.length}>
              <Sparkles className="size-4" /> All topics
            </RailButton>
            {categories.map((c) => {
              const Icon = ICON[c.icon];
              return (
                <RailButton
                  key={c.key}
                  active={!searching && cat === c.key}
                  onClick={() => setCat(c.key)}
                  count={countFor(c.key)}
                >
                  <Icon className="size-4" /> {c.label}
                </RailButton>
              );
            })}
          </div>
        </aside>

        {/* guides */}
        <div className="min-w-0 space-y-7">
          {searching && (
            <p className="text-sm text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for{" "}
              <span className="font-medium text-foreground">“{query}”</span>
            </p>
          )}

          {grouped.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
              <LifeBuoy className="size-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No guides found</p>
                <p className="text-sm text-muted-foreground">Try a different word, or browse a topic.</p>
              </div>
              <button
                onClick={() => {
                  setQuery("");
                  setCat("all");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            grouped.map(({ cat: c, items }) => {
              const Icon = ICON[c.icon];
              return (
                <section key={c.key} className="scroll-mt-20">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <h2 className="font-semibold">{c.label}</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((t) => (
                      <GuideCard
                        key={t.id}
                        task={t}
                        open={open === t.id}
                        onToggle={() => setOpen(open === t.id ? null : t.id)}
                        highlight={q}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function GuideCard({
  task,
  open,
  onToggle,
  highlight,
}: {
  task: HelpTask;
  open: boolean;
  onToggle: () => void;
  highlight: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-all",
        open ? "shadow-md ring-1 ring-primary/20" : "hover:border-primary/30 hover:shadow-sm"
      )}
    >
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-4 text-left">
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{mark(task.title, highlight)}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{task.summary}</p>
        </div>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-all",
            open ? "rotate-180 border-primary/40 bg-primary/10 text-primary" : "bg-card"
          )}
        >
          <ChevronDown className="size-4" />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <ol className="relative space-y-4 border-l border-dashed border-border pl-7">
              {task.steps.map((s, i) => (
                <li key={i} className="relative text-sm leading-relaxed text-foreground/90">
                  <span className="absolute -left-[35px] flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-4 ring-card">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
            {task.href && (
              <Link
                href={task.href}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {task.hrefLabel ?? "Open module"} <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// highlight the matched query inside a title
function mark(text: string, q: string): React.ReactNode {
  const term = q.trim();
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

function RailButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
      <span className={cn("ml-auto text-xs", active ? "text-primary/70" : "text-muted-foreground/60")}>
        {count}
      </span>
    </button>
  );
}

function MobileChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
