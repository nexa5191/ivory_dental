"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TopbarControls } from "@/components/shell/topbar-controls";

export function Topbar() {
  const pathname = usePathname();
  if (pathname.startsWith("/vendor-portal") || pathname.startsWith("/vendor-register")) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6 print:hidden">
      <div className="relative hidden max-w-xs flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" className="h-8 pl-9" />
      </div>

      <div className="ml-auto">
        <TopbarControls />
      </div>
    </header>
  );
}
