import { redirect } from "next/navigation";

// Procurement now lives as a sub-tab under the consolidated Vendor section.
export default function ProcurementPage() {
  redirect("/vendors?tab=procurement");
}
