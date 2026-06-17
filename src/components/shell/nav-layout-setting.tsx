"use client";

import { PanelLeft, PanelTop, Check } from "lucide-react";
import { usePrefs, type NavLayout } from "@/components/prefs/prefs-provider";
import { cn } from "@/lib/utils";

export function NavLayoutSetting() {
  const { nav, setNav } = usePrefs();

  return (
    <div className="grid grid-cols-2 gap-3">
      <LayoutOption
        value="sidebar"
        active={nav === "sidebar"}
        onClick={() => setNav("sidebar")}
        icon={<PanelLeft className="size-4" />}
        label="Left pane"
        hint="Recommended"
        preview={
          <>
            <div className="h-full w-1/3 rounded-l-sm bg-primary/30" />
            <div className="flex-1 space-y-1 p-1.5">
              <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/30" />
              <div className="h-1.5 w-full rounded-full bg-muted-foreground/15" />
              <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/15" />
            </div>
          </>
        }
      />
      <LayoutOption
        value="ribbon"
        active={nav === "ribbon"}
        onClick={() => setNav("ribbon")}
        icon={<PanelTop className="size-4" />}
        label="Top ribbon"
        preview={
          <div className="flex w-full flex-col">
            <div className="h-3 w-full rounded-t-sm bg-primary/30" />
            <div className="flex-1 space-y-1 p-1.5">
              <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/30" />
              <div className="h-1.5 w-full rounded-full bg-muted-foreground/15" />
              <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/15" />
            </div>
          </div>
        }
      />
    </div>
  );
}

function LayoutOption({
  active,
  onClick,
  icon,
  label,
  hint,
  preview,
}: {
  value: NavLayout;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  preview: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-xl border p-2.5 text-left transition-all",
        active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/40"
      )}
    >
      <div className="flex h-16 overflow-hidden rounded-md border bg-background">{preview}</div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={cn(active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
        {hint && (
          <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {hint}
          </span>
        )}
        {active && !hint && <Check className="ml-auto size-4 text-primary" />}
      </div>
    </button>
  );
}
