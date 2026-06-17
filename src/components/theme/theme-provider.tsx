"use client";

import * as React from "react";
import {
  DEFAULT_THEME,
  ThemeConfig,
  ThemeMode,
  applyMode,
  applyTheme,
  loadTheme,
  saveTheme,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (patch: Partial<ThemeConfig>) => void;
  reset: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeConfig>(DEFAULT_THEME);
  const [mounted, setMounted] = React.useState(false);

  // Hydrate from localStorage once on mount.
  React.useEffect(() => {
    const loaded = loadTheme();
    setThemeState(loaded);
    applyMode(loaded.mode);
    applyTheme(loaded);
    setMounted(true);
  }, []);

  // React to OS theme changes when in "system" mode.
  React.useEffect(() => {
    if (theme.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyMode("system");
      applyTheme(theme);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = React.useCallback(
    (patch: Partial<ThemeConfig>) => {
      setThemeState((prev) => {
        const next = { ...prev, ...patch };
        const root = document.documentElement;
        root.classList.add("theme-transition");
        window.clearTimeout((root as any).__themeTimer);
        (root as any).__themeTimer = window.setTimeout(
          () => root.classList.remove("theme-transition"),
          450
        );
        if (patch.mode !== undefined) applyMode(next.mode as ThemeMode);
        applyTheme(next);
        saveTheme(next);
        return next;
      });
    },
    []
  );

  const reset = React.useCallback(() => setTheme(DEFAULT_THEME), [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, reset }}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>{children}</div>
    </ThemeContext.Provider>
  );
}
