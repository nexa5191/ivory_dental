"use client";

import { usePrefs } from "@/components/prefs/prefs-provider";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Ribbon } from "./ribbon";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { nav } = usePrefs();

  if (nav === "ribbon") {
    return (
      <div className="flex min-h-screen flex-col">
        <Ribbon />
        <main className="flex-1 p-4 md:p-6 print:p-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
