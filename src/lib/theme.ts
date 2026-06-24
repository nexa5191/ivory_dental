// Theme engine: converts a base accent (HSL) into a full set of CSS variables,
// including a derived, analogous chart palette so graphs always match the brand.

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeConfig {
  hue: number; // 0-360
  saturation: number; // 0-100
  lightness: number; // 0-100
  radius: number; // px
  mode: ThemeMode;
}

export const DEFAULT_THEME: ThemeConfig = {
  hue: 222,
  saturation: 75,
  lightness: 55,
  radius: 12,
  mode: "light",
};

export const PRESETS: { name: string; hue: number; saturation: number; lightness: number }[] = [
  { name: "Indigo", hue: 243, saturation: 75, lightness: 58 },
  { name: "Ocean", hue: 205, saturation: 80, lightness: 50 },
  { name: "Emerald", hue: 154, saturation: 62, lightness: 42 },
  { name: "Amber", hue: 32, saturation: 92, lightness: 50 },
  { name: "Rose", hue: 346, saturation: 75, lightness: 56 },
  { name: "Violet", hue: 272, saturation: 70, lightness: 60 },
  { name: "Slate", hue: 222, saturation: 18, lightness: 40 },
];

const STORAGE_KEY = "stockly-theme";

export function loadTheme(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(config: ThemeConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function wrapHue(h: number) {
  return ((h % 360) + 360) % 360;
}

// Apply the accent + derived tokens to the document root.
export function applyTheme(config: ThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const { hue, saturation, lightness, radius } = config;

  const isDark = root.classList.contains("dark");
  const accentL = isDark ? Math.min(lightness + 5, 70) : lightness;

  root.style.setProperty("--primary", `hsl(${hue} ${saturation}% ${accentL}%)`);
  root.style.setProperty("--ring", `hsl(${hue} ${saturation}% ${accentL}%)`);
  root.style.setProperty(
    "--primary-foreground",
    accentL > 62 ? "hsl(222 47% 11%)" : "hsl(0 0% 100%)"
  );

  // Analogous + complementary chart palette derived from the accent hue.
  const offsets = [0, 32, -28, 64, -56];
  offsets.forEach((off, i) => {
    const h = wrapHue(hue + off);
    const s = Math.max(saturation - i * 4, 40);
    const l = isDark ? accentL + (i % 2 === 0 ? 2 : 8) : lightness + (i % 2 === 0 ? 0 : 6);
    root.style.setProperty(`--chart-${i + 1}`, `hsl(${h} ${s}% ${l}%)`);
  });

  root.style.setProperty("--radius", `${radius / 16}rem`);
}

export function applyMode(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}

export function hslString(h: number, s: number, l: number) {
  return `hsl(${h} ${s}% ${l}%)`;
}
