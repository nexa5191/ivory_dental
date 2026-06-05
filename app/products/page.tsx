import { Suspense } from "react";
import { listProducts, listMovements, suppliers } from "@/lib/store";
import { WAREHOUSES } from "@/lib/mock-data";
import { PageHeader } from "@/components/shell/page-header";
import { InventoryHub } from "@/components/products/inventory-hub";

export default function InventoryPage() {
  const products = listProducts();

  return (
    <div className="animate-fade-in">
      <PageHeader title="Inventory" subtitle={`${products.length} items · stock, consumption & suppliers`} />
      <Suspense>
        <InventoryHub
          products={products}
          suppliers={suppliers}
          movements={listMovements()}
          warehouses={WAREHOUSES}
        />
      </Suspense>
    </div>
  );
}
