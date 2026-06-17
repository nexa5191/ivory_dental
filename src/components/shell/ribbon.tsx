"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, SECONDARY_NAV, isNavActive } from "./nav-items";
import { TopbarControls } from "@/components/shell/topbar-controls";

export function Ribbon() {
  const pathname = usePathname();
  if (pathname.startsWith("/vendor-portal") || pathname.startsWith("/vendor-register")) return null;

  const items = [...NAV, ...SECONDARY_NAV];

  return (
    <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur print:hidden">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Stethoscope className="size-5" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight sm:block">Ivory</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-thin">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0">
          <TopbarControls />
        </div>
      </div>
    </header>
  );
}
