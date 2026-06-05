"use client";

import * as React from "react";
import { Palette } from "lucide-react";
import { ColorStudio } from "./color-studio";

export function ThemePopover() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
      >
        <Palette className="size-4 text-primary" />
        <span className="hidden sm:inline">Theme</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 rounded-xl border bg-card p-4 shadow-2xl animate-fade-in">
          <ColorStudio compact />
        </div>
      )}
    </div>
  );
}
