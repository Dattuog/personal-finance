import type { Metadata } from "next";
import { CreditCard, Landmark, Plus, WalletCards } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";
import { formatMoney } from "@/lib/money/decimal";
import { Card } from "@/components/ui/card";
import { createAccountAction } from "@/modules/accounts/actions";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const user = await requireUser();
  const [accounts, profile] = await Promise.all([
    db.financialAccount.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    db.userProfile.findUnique({
      where: { userId: user.id },
      select: { currencyCode: true },
    }),
  ]);
  const workspaceCurrency = profile?.currencyCode ?? "INR";
  const field =
    "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 outline-none focus:ring-2 focus:ring-[var(--ring)]";
  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--primary)]">
          Money locations
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Use labels only—never enter a full account or card number.
        </p>
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section aria-labelledby="account-list">
          <h2 id="account-list" className="sr-only">
            Account list
          </h2>
          {accounts.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {accounts.map((account) => {
                const Icon =
                  account.type === "CREDIT_CARD"
                    ? CreditCard
                    : account.type === "BANK"
                      ? Landmark
                      : WalletCards;
                return (
                  <Card key={account.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <span className="grid size-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
                        {account.type.toLocaleLowerCase().replaceAll("_", " ")}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold">{account.name}</h3>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {account.institutionName || "Manual account"}
                      {account.lastFourDigits
                        ? ` · •••• ${account.lastFourDigits}`
                        : ""}
                    </p>
                    <p className="mt-4 text-xs text-[var(--muted-foreground)]">
                      Opening balance
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {formatMoney(
                        account.openingBalance.toString(),
                        account.currencyCode,
                      )}
                    </p>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed p-8 text-center">
              <WalletCards
                className="mx-auto size-7 text-[var(--primary)]"
                aria-hidden="true"
              />
              <h2 className="mt-4 font-bold">Add where your money lives</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Start with one bank or cash account. Opening balances anchor
                future calculations.
              </p>
            </Card>
          )}
        </section>
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--primary)]" aria-hidden="true" />
            <h2 className="font-bold">Add account</h2>
          </div>
          <form action={createAccountAction} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">
              Account name
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Primary bank"
                className={`${field} mt-2`}
              />
            </label>
            <label className="block text-sm font-semibold">
              Type
              <select name="type" className={`${field} mt-2`}>
                {[
                  "BANK",
                  "CASH",
                  "WALLET",
                  "CREDIT_CARD",
                  "INVESTMENT",
                  "LOAN",
                  "OTHER",
                ].map((type) => (
                  <option key={type} value={type}>
                    {type.toLocaleLowerCase().replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <label className="block text-sm font-semibold">
                Opening balance
                <input
                  name="openingBalance"
                  required
                  inputMode="decimal"
                  defaultValue="0.00"
                  className={`${field} mt-2`}
                />
              </label>
              <label className="block text-sm font-semibold">
                Currency
                <input
                  name="currencyCode"
                  required
                  value={workspaceCurrency}
                  readOnly
                  aria-readonly="true"
                  maxLength={3}
                  className={`${field} mt-2 cursor-not-allowed bg-[var(--muted)] uppercase`}
                />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Balance date
              <input
                type="date"
                name="openingBalanceDate"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={`${field} mt-2`}
              />
            </label>
            <label className="block text-sm font-semibold">
              Institution{" "}
              <span className="font-normal text-[var(--muted-foreground)]">
                (optional)
              </span>
              <input
                name="institutionName"
                maxLength={100}
                className={`${field} mt-2`}
              />
            </label>
            <label className="block text-sm font-semibold">
              Last four digits{" "}
              <span className="font-normal text-[var(--muted-foreground)]">
                (optional)
              </span>
              <input
                name="lastFourDigits"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                className={`${field} mt-2`}
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
            >
              Save account
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
