import { ThemeProvider } from "@/components/theme/theme-provider";
import { PrefsProvider } from "@/components/prefs/prefs-provider";
import { AppShell } from "@/components/shell/app-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <PrefsProvider>
        <AppShell>{children}</AppShell>
      </PrefsProvider>
    </ThemeProvider>
  );
}
