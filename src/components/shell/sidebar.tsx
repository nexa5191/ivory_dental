"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, SECONDARY_NAV, isNavActive } from "./nav-items";
import { signOut } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

    /** Controls whether the logout confirmation dialog is open */
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  /** Controls loading state during logout */
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // The vendor self-service portal & registration are external surfaces — no clinic chrome.
  if (pathname.startsWith("/vendor-portal") || pathname.startsWith("/vendor-register")) return null;

    // ============================================================================
  // HANDLERS
  // ============================================================================

  /** Handle logout button click - shows confirmation dialog */
  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  /** Handle confirmed logout - closes dialog and logs out */
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

    /** Handle cancelled logout - just closes dialog */
  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const isActive = (href: string) => isNavActive(pathname, href);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card transition-[width] duration-200 md:flex print:!hidden",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Stethoscope className="size-5" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <span className="text-lg font-bold tracking-tight">Ivory</span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Dental Suite
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t px-3 py-3">
        {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeft className="size-[18px] shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-[18px] shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
        <button
          onClick={handleLogoutClick}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span>Logout</span>
        </button>

              {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelLogout}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </aside>
  );
}
