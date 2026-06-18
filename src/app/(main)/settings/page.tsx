import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorStudio } from "@/components/theme/color-studio";
import { FontSetting } from "@/components/theme/font-setting";
import { NavLayoutSetting } from "@/components/shell/nav-layout-setting";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Settings" subtitle="Personalize Stockly and manage your workspace" />

      <Link href="/settings/compare" className="block">
        <Card className="flex items-center justify-between gap-3 p-5 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Features &amp; comparison</p>
              <p className="text-sm text-muted-foreground">
                MVP feature matrix vs competitors and the value add — great for a demo.
              </p>
            </div>
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
        </Card>
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pick your brand color — the whole app recolors instantly and remembers your choice.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ColorStudio />
            <div className="border-t pt-5">
              <FontSetting />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Navigation layout</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose where modules live — a left pane or a top ribbon. Applies instantly and is
                remembered on this device.
              </p>
            </CardHeader>
            <CardContent>
              <NavLayoutSetting />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Company name
                </span>
                <Input defaultValue="Stockly Demo Co." />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Base currency
                </span>
                <Input defaultValue="USD ($)" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Default warehouse
                </span>
                <Input defaultValue="WH-1 Main" />
              </label>
              <Button>Save workspace</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low-stock alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Email me when items hit reorder point", true],
                ["Daily digest of low-stock items", true],
                ["Notify on out-of-stock", false],
              ].map(([label, on]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span>{label}</span>
                  <span
                    className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                      on ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`size-5 rounded-full bg-white shadow transition-transform ${
                        on ? "translate-x-5" : ""
                      }`}
                    />
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
