"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Boxes } from "lucide-react";
import type { Product, Supplier, Movement } from "@/lib/mock-data";
import { ProductsClient } from "@/components/products/products-client";
import { AddProductButton } from "@/components/products/add-button";
import { StockView } from "@/components/products/stock-view";
import type { StockProduct } from "@/components/products/stock-actions";
import { cn } from "@/lib/utils";

type Tab = "products" | "stock";

export function InventoryHub({
  products,
  suppliers,
  movements,
  warehouses,
}: {
  products: Product[];
  suppliers: Supplier[];
  movements: Movement[];
  warehouses: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initial: Tab = params.get("tab") === "stock" ? "stock" : "products";
  const [tab, setTab] = React.useState<Tab>(initial);

  const select = (t: Tab) => {
    setTab(t);
    router.replace(`/products${t === "stock" ? "?tab=stock" : ""}`, { scroll: false });
  };

  const stockProducts: StockProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    stock: p.stock,
    location: p.location,
  }));

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          <TabButton active={tab === "products"} onClick={() => select("products")} icon={<Package className="size-4" />}>
            Products
          </TabButton>
          <TabButton active={tab === "stock"} onClick={() => select("stock")} icon={<Boxes className="size-4" />}>
            Stock &amp; consumption
          </TabButton>
        </div>
        {tab === "products" && <AddProductButton />}
      </div>

      {tab === "products" ? (
        <ProductsClient initialProducts={products} suppliers={suppliers} />
      ) : (
        <StockView movements={movements} products={stockProducts} warehouses={warehouses} />
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
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
