"use client";

import * as React from "react";
import { CURRENCIES, Currency, findCurrency } from "@/lib/currency";
import { fontValue, DEFAULT_FONT } from "@/lib/fonts";

export const ALL_LOCATIONS = "All locations";

export type NavLayout = "sidebar" | "ribbon";

interface Prefs {
  currency: Currency;
  setCurrency: (code: string) => void;
  location: string;
  setLocation: (loc: string) => void;
  nav: NavLayout;
  setNav: (n: NavLayout) => void;
  font: string;
  setFont: (key: string) => void;
}

const PrefsContext = React.createContext<Prefs | null>(null);

export function usePrefs() {
  const ctx = React.useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}

const KEY = "stockly-prefs";

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = React.useState("INR");
  const [location, setLocationState] = React.useState(ALL_LOCATIONS);
  const [nav, setNavState] = React.useState<NavLayout>("sidebar");
  const [font, setFontState] = React.useState<string>(DEFAULT_FONT);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.currency) setCurrencyCode(p.currency);
        if (p.location) setLocationState(p.location);
        if (p.nav === "sidebar" || p.nav === "ribbon") setNavState(p.nav);
        if (p.font) setFontState(p.font);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: { currency?: string; location?: string; nav?: NavLayout; font?: string }) =>
    localStorage.setItem(
      KEY,
      JSON.stringify({ currency: currencyCode, location, nav, font, ...next })
    );

  const setCurrency = (code: string) => {
    setCurrencyCode(code);
    persist({ currency: code });
  };
  const setLocation = (loc: string) => {
    setLocationState(loc);
    persist({ location: loc });
  };
  const setNav = (n: NavLayout) => {
    setNavState(n);
    persist({ nav: n });
  };
  const setFont = (key: string) => {
    setFontState(key);
    document.documentElement.style.setProperty("--font-sans", fontValue(key));
    persist({ font: key });
  };

  const value: Prefs = {
    currency: findCurrency(currencyCode),
    setCurrency,
    location,
    setLocation,
    nav,
    setNav,
    font,
    setFont,
  };

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export { CURRENCIES };
