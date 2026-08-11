import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[calc(100vh-145px)] max-w-md items-center px-5 py-12">
      <Card className="w-full p-6 sm:p-8">
        {sent === "1" ? (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--success)]">
              <MailCheck className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              Check your inbox
            </h1>
            <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
              Your private sign-in link is on its way. You can close this tab
              after opening the email.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 mb-7 text-[var(--muted-foreground)]">
              No password to remember. We’ll verify your email with a secure
              link.
            </p>
            <EmailSignInForm />
            <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
              New to FinPilot?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[var(--primary)] hover:underline"
              >
                Create your plan
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
