import { Suspense } from "react";
import { listRfqs, listVendors, listPurchaseOrders, procurementMetrics } from "@/lib/vendors";
import { suppliers, listProducts } from "@/lib/store";
import { PageHeader } from "@/components/shell/page-header";
import { VendorHub } from "@/components/clinic/vendor-hub";

export default function VendorPage() {
  const vendors = listVendors();
  const products = listProducts();
  const inventorySuppliers = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    contact: s.contact,
    email: s.email,
    rating: s.rating,
    products: products.filter((p) => p.supplierId === s.id).length,
  }));
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Vendor"
        subtitle="Vendor master and procurement — registration, requests, quotes and purchases"
      />
      <Suspense>
        <VendorHub
          vendors={vendors}
          rfqs={listRfqs()}
          pos={listPurchaseOrders()}
          metrics={procurementMetrics()}
          inventorySuppliers={inventorySuppliers}
        />
      </Suspense>
    </div>
  );
}
