import { redirect } from "next/navigation";

// Stock & consumption now lives as a sub-tab under Inventory.
export default function StockPage() {
  redirect("/products?tab=stock");
}
