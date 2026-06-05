"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintBar({ backHref, label }: { backHref: string; label: string }) {
  return (
    <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between print:hidden">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
      <Button size="sm" onClick={() => window.print()}>
        <Printer className="size-4" /> Print / Download {label} PDF
      </Button>
    </div>
  );
}
