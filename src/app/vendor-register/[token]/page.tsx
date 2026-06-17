import { getVendorInvite, getVendor } from "@/lib/vendors";
import { VendorRegisterClient } from "@/components/clinic/vendor-register-client";
import { Stethoscope } from "lucide-react";

export const metadata = {
  title: "Vendor Registration — Ivory Dental Suite",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#1f6feb] text-white">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">Ivory Dental Suite</p>
            <p className="text-xs text-muted-foreground">Vendor registration</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function VendorRegisterPage({ params }: { params: { token: string } }) {
  const invite = getVendorInvite(params.token);

  if (!invite) {
    return (
      <Shell>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-base font-semibold">Invalid registration link</p>
          <p className="mt-1 text-sm text-muted-foreground">This invite link is not recognised. Please ask Ivory Dental for a fresh link.</p>
        </div>
      </Shell>
    );
  }

  if (invite.status === "registered") {
    const v = invite.vendorId ? getVendor(invite.vendorId) : null;
    return (
      <Shell>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-base font-semibold text-success">Registration complete</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {v ? `${v.name} is already registered with Ivory Dental.` : "This invite has already been used."} Our procurement team will be in touch.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <VendorRegisterClient token={params.token} inviteEmail={invite.email ?? ""} invitePhone={invite.phone ?? ""} />
    </Shell>
  );
}
