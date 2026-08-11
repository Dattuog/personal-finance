import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-145px)] max-w-md items-center px-5 py-12">
      <Card className="w-full p-6 sm:p-8">
        <p className="text-sm font-bold tracking-[0.16em] text-[var(--primary)] uppercase">
          Start with clarity
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Create your FinPilot account
        </h1>
        <p className="mt-2 mb-7 text-[var(--muted-foreground)]">
          Use your email to create a passwordless account, then set up your
          first financial month.
        </p>
        <EmailSignInForm callbackUrl="/onboarding" />
        <p className="mt-5 text-xs leading-5 text-[var(--muted-foreground)]">
          By continuing, you agree to our{" "}
          <Link className="underline" href="/terms">
            terms
          </Link>{" "}
          and acknowledge our{" "}
          <Link className="underline" href="/privacy">
            privacy notice
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
