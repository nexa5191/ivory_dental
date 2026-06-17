"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, ShoppingCart } from "lucide-react";
import type { Vendor, Rfq, PurchaseOrder } from "@/lib/vendors";
import { VendorsClient, type InventorySupplier } from "@/components/clinic/vendors-client";
import { ProcurementClient } from "@/components/clinic/procurement-client";
import { cn } from "@/lib/utils";

interface Metrics {
  vendors: number;
  openRequests: number;
  awaitingQuotes: number;
  purchaseOrders: number;
  poValue: number;
  payablesDue: number;
}

type Tab = "master" | "procurement";

export function VendorHub({
  vendors,
  rfqs,
  pos,
  metrics,
  inventorySuppliers,
}: {
  vendors: Vendor[];
  rfqs: Rfq[];
  pos: PurchaseOrder[];
  metrics: Metrics;
  inventorySuppliers: InventorySupplier[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initial: Tab = params.get("tab") === "procurement" ? "procurement" : "master";
  const [tab, setTab] = React.useState<Tab>(initial);

  const select = (t: Tab) => {
    setTab(t);
    // keep the URL in sync so deep links / refreshes land on the same sub-tab
    const qs = t === "procurement" ? "?tab=procurement" : "";
    router.replace(`/vendors${qs}`, { scroll: false });
  };

  return (
    <>
      <div className="mb-5 inline-flex rounded-lg border bg-muted/40 p-1">
        <TabButton active={tab === "master"} onClick={() => select("master")} icon={<Store className="size-4" />}>
          Vendor master
        </TabButton>
        <TabButton
          active={tab === "procurement"}
          onClick={() => select("procurement")}
          icon={<ShoppingCart className="size-4" />}
        >
          Procurement
        </TabButton>
      </div>

      {tab === "master" ? (
        <VendorsClient vendors={vendors} inventorySuppliers={inventorySuppliers} />
      ) : (
        <ProcurementClient rfqs={rfqs} vendors={vendors} pos={pos} metrics={metrics} />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
