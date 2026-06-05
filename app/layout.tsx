import type { Metadata } from "next";
import { Inter, Manrope, Plus_Jakarta_Sans, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PrefsProvider } from "@/components/prefs/prefs-provider";
import { AppShell } from "@/components/shell/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

const fontVars = `${inter.variable} ${manrope.variable} ${jakarta.variable} ${lora.variable} ${jetbrains.variable}`;

export const metadata: Metadata = {
  title: "Ivory — Dental Practice Suite",
  description: "Clinic management: appointments, patient charts, dental records, Rx, and billing.",
};

// Applied before paint to avoid a flash of the default palette.
const noFlash = `(function(){try{var t=JSON.parse(localStorage.getItem('stockly-theme')||'{}');var h=t.hue??222,s=t.saturation??75,l=t.lightness??55,r=t.radius??12,m=t.mode||'light';var d=document.documentElement;var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;if(m==='dark'||(m==='system'&&prefersDark))d.classList.add('dark');var L=d.classList.contains('dark')?Math.min(l+5,70):l;d.style.setProperty('--primary',h+' '+s+'% '+L+'%');d.style.setProperty('--ring',h+' '+s+'% '+L+'%');d.style.setProperty('--primary-foreground',L>62?'222 47% 11%':'0 0% 100%');var off=[0,32,-28,64,-56];off.forEach(function(o,i){var hh=((h+o)%360+360)%360;var ss=Math.max(s-i*4,40);var ll=d.classList.contains('dark')?L+(i%2===0?2:8):l+(i%2===0?0:6);d.style.setProperty('--chart-'+(i+1),hh+' '+ss+'% '+ll+'%');});d.style.setProperty('--radius',(r/16)+'rem');}catch(e){}try{var pf=JSON.parse(localStorage.getItem('stockly-prefs')||'{}');var fmap={inter:'var(--font-inter)',manrope:'var(--font-manrope)',jakarta:'var(--font-jakarta)',lora:'var(--font-lora)',jetbrains:'var(--font-jetbrains)',system:"ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"};var fk=(pf.font&&fmap[pf.font])?pf.font:'inter';document.documentElement.style.setProperty('--font-sans',fmap[fk]);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <PrefsProvider>
            <AppShell>{children}</AppShell>
          </PrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
