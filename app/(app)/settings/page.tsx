import type { Metadata } from "next";
import { BrainCircuit, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import {
  defaultExpenseEssentiality,
  expenseEssentialityLabel,
  expenseEssentialityValues,
  type ExpenseEssentiality,
} from "@/modules/insights/essentiality";
import {
  updateExpenseEssentialityAction,
  updateSettingsAction,
} from "@/modules/settings/actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [profile, expenseCategories, essentialityOverrides, accountCount] =
    await Promise.all([
      db.userProfile.findUnique({ where: { userId: user.id } }),
      db.category.findMany({
        where: {
          kind: "EXPENSE",
          isArchived: false,
          OR: [{ userId: user.id }, { userId: null, isSystem: true }],
        },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, necessity: true },
      }),
      db.categoryEssentialityOverride.findMany({ where: { userId: user.id } }),
      db.financialAccount.count({ where: { userId: user.id } }),
    ]);
  const overrideByCategory = new Map(
    essentialityOverrides.map((override) => [
      override.categoryId,
      override.essentiality.toLocaleLowerCase() as ExpenseEssentiality,
    ]),
  );
  const field =
    "mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 outline-none focus:ring-2 focus:ring-[var(--ring)]";
  return (
    <div className="max-w-4xl">
      <div>
        <p className="text-sm font-semibold text-[var(--primary)]">
          Preferences and privacy
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Control month boundaries, display defaults, and optional AI
          processing.
        </p>
      </div>
      <form action={updateSettingsAction} className="mt-7 space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <ShieldCheck
              className="size-5 text-[var(--primary)]"
              aria-hidden="true"
            />
            Financial defaults
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Currency code
              <input
                name="currencyCode"
                defaultValue={profile?.currencyCode ?? "INR"}
                readOnly={accountCount > 0}
                aria-readonly={accountCount > 0}
                maxLength={3}
                className={`${field} ${accountCount > 0 ? "cursor-not-allowed bg-[var(--muted)]" : ""}`}
              />
              {accountCount > 0 && (
                <span className="mt-2 block text-xs leading-5 font-normal text-[var(--muted-foreground)]">
                  Locked because currency conversion is not supported for
                  existing accounts.
                </span>
              )}
            </label>
            <label className="text-sm font-semibold">
              Locale
              <input
                name="locale"
                defaultValue={profile?.locale ?? "en-IN"}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold">
              Timezone
              <input
                name="timezone"
                defaultValue={profile?.timezone ?? "Asia/Kolkata"}
                className={field}
              />
            </label>
            <label className="text-sm font-semibold">
              Financial month starts on
              <input
                name="financialMonthStartDay"
                type="number"
                min={1}
                max={28}
                defaultValue={profile?.financialMonthStartDay ?? 1}
                className={field}
              />
            </label>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <BrainCircuit className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-bold">AI insights</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                When enabled, FinPilot may send compact, calculated metrics to
                Google Gemini for explanation. It excludes your email, name,
                account identifiers, raw notes, and authentication data. Core
                analytics never require AI.
              </p>
            </div>
          </div>
          <label className="mt-5 flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3.5">
            <span>
              <span className="block text-sm font-semibold">
                Allow AI-generated explanations
              </span>
              <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                Disabled by default and reversible at any time.
              </span>
            </span>
            <input
              name="aiEnabled"
              type="checkbox"
              defaultChecked={profile?.aiEnabled ?? false}
              className="size-5 accent-[var(--primary)]"
            />
          </label>
        </Card>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Save settings
        </button>
      </form>
      <form action={updateExpenseEssentialityAction} className="mt-6">
        <Card className="p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]">
              <SlidersHorizontal className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-bold">Expense context for AI</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Override how a category should be interpreted in AI reviews.
                This changes explanation and recommendations only; it never
                changes transaction totals or accounting calculations.
              </p>
            </div>
          </div>
          <details className="mt-5 rounded-xl border border-[var(--border)]">
            <summary className="min-h-12 cursor-pointer px-4 py-3 text-sm font-semibold">
              Review {expenseCategories.length} expense classifications
            </summary>
            <div className="grid gap-4 border-t border-[var(--border)] p-4 sm:grid-cols-2">
              {expenseCategories.map((category) => {
                const categoryDefault = defaultExpenseEssentiality({
                  key: category.slug,
                  necessity: category.necessity,
                });
                return (
                  <label
                    key={category.id}
                    className="block text-sm font-semibold"
                  >
                    {category.name}
                    <select
                      name={`essentiality:${category.id}`}
                      defaultValue={
                        overrideByCategory.get(category.id) ?? "default"
                      }
                      className={field}
                    >
                      <option value="default">
                        Use default ({expenseEssentialityLabel(categoryDefault)}
                        )
                      </option>
                      {expenseEssentialityValues.map((value) => (
                        <option key={value} value={value}>
                          {expenseEssentialityLabel(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </details>
          <button
            type="submit"
            className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
          >
            Save expense context
          </button>
        </Card>
      </form>
    </div>
  );
}
