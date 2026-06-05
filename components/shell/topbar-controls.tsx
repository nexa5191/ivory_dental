"use client";

import { Bell, Moon, Sun, MapPin, Coins } from "lucide-react";
import { ThemePopover } from "@/components/theme/theme-popover";
import { useTheme } from "@/components/theme/theme-provider";
import { usePrefs, CURRENCIES, ALL_LOCATIONS } from "@/components/prefs/prefs-provider";
import { CLINIC_LOCATIONS } from "@/lib/clinic";
import { Select } from "@/components/ui/input";

export function TopbarControls() {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, location, setLocation } = usePrefs();
  const isDark = theme.mode === "dark";

  return (
    <div className="flex items-center gap-2">
      {/* Location switcher */}
      <div className="relative hidden md:block">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-8 pl-8 pr-2 text-xs font-medium"
          title="Location"
        >
          <option value={ALL_LOCATIONS}>{ALL_LOCATIONS}</option>
          {CLINIC_LOCATIONS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </Select>
      </div>

      {/* Currency switcher */}
      <div className="relative hidden sm:block">
        <Coins className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Select
          value={currency.code}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-8 pl-8 pr-2 text-xs font-medium"
          title="Currency"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </Select>
      </div>

      <ThemePopover />

      <button
        onClick={() => setTheme({ mode: isDark ? "light" : "dark" })}
        className="inline-flex size-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
        title="Toggle dark mode"
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      <button className="relative inline-flex size-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent">
        <Bell className="size-4" />
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-background" />
      </button>

      <div className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-accent">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          AD
        </div>
        <div className="hidden leading-tight lg:block">
          <p className="text-xs font-semibold">Admin</p>
          <p className="text-[11px] text-muted-foreground">{location}</p>
        </div>
      </div>
    </div>
  );
}
