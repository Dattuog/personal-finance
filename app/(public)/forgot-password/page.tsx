import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";

export const metadata: Metadata = { title: "Recover access" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-145px)] max-w-md items-center px-5 py-12">
      <Card className="w-full p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Recover access</h1>
        <p className="mt-2 mb-7 text-[var(--muted-foreground)]">
          FinPilot uses passwordless access, so there is no password to reset.
          Request a fresh secure link below.
        </p>
        <EmailSignInForm />
      </Card>
    </div>
  );
}
