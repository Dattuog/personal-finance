import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";
import { saveOnboardingProfileAction } from "@/modules/users/onboarding-action";

export const metadata: Metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await db.userProfile.findUnique({
    where: { userId: user.id },
  });
  const field =
    "mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 outline-none focus:ring-2 focus:ring-[var(--ring)]";
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <div className="mt-10">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--primary)]">Step 1 of 8</span>
            <span className="text-[var(--muted-foreground)]">
              Personal defaults
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
            <div className="h-full w-1/8 rounded-full bg-[var(--primary)]" />
          </div>
        </div>
        <Card className="mt-6 p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Make FinPilot feel local
          </h1>
          <p className="mt-2 leading-7 text-[var(--muted-foreground)]">
            These settings determine currency display and financial month
            boundaries. Your next step is adding the first account.
          </p>
          <form
            action={saveOnboardingProfileAction}
            className="mt-7 grid gap-5 sm:grid-cols-2"
          >
            <label className="text-sm font-semibold sm:col-span-2">
              Your name
              <input
                name="name"
                required
                minLength={2}
                defaultValue={user.name ?? ""}
                autoComplete="name"
                className={field}
              />
            </label>
            <label className="text-sm font-semibold">
              Currency
              <input
                name="currencyCode"
                required
                maxLength={3}
                defaultValue={profile?.currencyCode ?? "INR"}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold">
              Locale
              <input
                name="locale"
                required
                defaultValue={profile?.locale ?? "en-IN"}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Timezone
              <input
                name="timezone"
                required
                defaultValue={profile?.timezone ?? "Asia/Kolkata"}
                className={field}
              />
            </label>
            <div className="sm:col-span-2 sm:text-right">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Save and add an account
              </button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
