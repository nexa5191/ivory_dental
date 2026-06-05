// App font options. The actual font files are loaded via next/font in layout.tsx
// (each exposes a --font-* CSS variable); switching sets --font-sans to one of them.

export interface AppFont {
  key: string;
  label: string;
  value: string; // CSS value applied to --font-sans
  note?: string;
}

export const APP_FONTS: AppFont[] = [
  { key: "inter", label: "Inter", value: "var(--font-inter)", note: "Default · clean UI sans" },
  { key: "manrope", label: "Manrope", value: "var(--font-manrope)", note: "Geometric, friendly" },
  { key: "jakarta", label: "Plus Jakarta Sans", value: "var(--font-jakarta)", note: "Rounded, modern" },
  { key: "lora", label: "Lora", value: "var(--font-lora)", note: "Serif, editorial" },
  { key: "jetbrains", label: "JetBrains Mono", value: "var(--font-jetbrains)", note: "Monospaced" },
  {
    key: "system",
    label: "System UI",
    value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    note: "Native, no download",
  },
];

export const DEFAULT_FONT = "inter";

export function fontValue(key: string): string {
  return APP_FONTS.find((f) => f.key === key)?.value ?? APP_FONTS[0].value;
}
