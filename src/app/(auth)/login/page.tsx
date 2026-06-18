import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign In — Ivory" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl ?? "/";

  return (
    <div className="w-full max-w-sm px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Ivory Dental</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
