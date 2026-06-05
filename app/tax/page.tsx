import { redirect } from "next/navigation";

// Tax reporting now lives under Reports → "Tax reports". Keep this path working.
export default function TaxPage() {
  redirect("/reports?view=tax");
}
