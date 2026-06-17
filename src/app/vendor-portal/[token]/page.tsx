import { notFound } from "next/navigation";
import { vendorPortalData } from "@/lib/vendors";
import { VendorPortalClient } from "@/components/clinic/vendor-portal-client";

export const metadata = {
  title: "Vendor Portal — Ivory Dental Suite",
};

export default function VendorPortalPage({ params }: { params: { token: string } }) {
  const data = vendorPortalData(params.token);
  if (!data) notFound();
  return <VendorPortalClient token={params.token} data={data} />;
}
