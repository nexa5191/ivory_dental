"use client";

import * as React from "react";
import { RotateCw, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlipCard({
  front,
  back,
  className,
  height = "h-40",
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  height?: string;
}) {
  const [flipped, setFlipped] = React.useState(false);

  return (
    <div className={cn("flip", height, className)}>
      <div className={cn("flip-inner", flipped && "is-flipped")}>
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="flip-face group rounded-lg border bg-card text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {front}
          <RotateCw className="absolute bottom-3 right-3 size-3.5 text-muted-foreground/50 transition-colors group-hover:text-primary" />
        </button>
        <div className="flip-back flip-face overflow-hidden rounded-lg border bg-card shadow-sm">
          {back}
          <button
            type="button"
            onClick={() => setFlipped(false)}
            className="absolute bottom-3 right-3 text-muted-foreground/60 hover:text-primary"
          >
            <Undo2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
