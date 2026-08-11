import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  Plus,
  ReceiptIndianRupee,
  WalletCards,
} from "lucide-react";
import { format } from "date-fns";
import type Decimal from "decimal.js";
import { requireUser } from "@/lib/auth/require-user";
import { getDashboardData } from "@/modules/dashboard/service";
import { formatMoney } from "@/lib/money/decimal";
import { MetricCard } from "@/components/finance/metric-card";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const money = (value: Decimal.Value) => formatMoney(value, data.currencyCode);
  const hasTransactions = data.recentTransactions.length > 0;
  const savingsRate = data.summary.savingsRate
    ? `${data.summary.savingsRate.times(100).toDecimalPlaces(1).toString()}%`
    : "—";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">
            {format(data.range.start, "MMMM yyyy")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em]">
            Your financial position
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Income, consumption, and wealth allocation—clearly separated.
          </p>
        </div>
        <Link
          href="/transactions/new"
          className={buttonVariants({ variant: "primary" })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add transaction
        </Link>
      </div>

      {!hasTransactions && (
        <Card className="mt-7 border-dashed p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <ReceiptIndianRupee className="size-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="font-bold">
                Start with your first real transaction
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Add income or an expense. FinPilot will calculate this month as
                soon as data exists.
              </p>
            </div>
            <Link
              href="/transactions/new"
              className={buttonVariants({ variant: "secondary" })}
            >
              Add the first one
            </Link>
          </div>
        </Card>
      )}

      <section aria-labelledby="monthly-summary" className="mt-7">
        <h2 id="monthly-summary" className="sr-only">
          Monthly summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total income"
            value={money(data.summary.income)}
            definition="Cleared income received during this financial month."
            icon={ArrowUpRight}
            tone="income"
          />
          <MetricCard
            label="Net expenses"
            value={money(data.summary.netExpenses)}
            definition="Cleared consumption expenses minus refunds. Transfers and investments are excluded."
            icon={ArrowDownRight}
            tone="expense"
          />
          <MetricCard
            label="Total invested"
            value={money(data.summary.investments)}
            definition="Cash allocated to investment accounts, shown separately from ordinary spending."
            icon={Landmark}
            tone="investment"
          />
          <MetricCard
            label="Cash remaining"
            value={money(data.summary.cashRemainingAfterInvestments)}
            definition="Income minus net expenses and investment contributions for the selected month."
            icon={PiggyBank}
            detail={`Savings rate before investments: ${savingsRate}`}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <h2 className="font-bold">Recent transactions</h2>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Latest cleared and pending activity
              </p>
            </div>
            <Link
              href="/transactions"
              className="text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          {hasTransactions ? (
            <div className="divide-y divide-[var(--border)]">
              {data.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--muted)]">
                    <WalletCards className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {transaction.merchant ||
                        transaction.description ||
                        transaction.type
                          .toLocaleLowerCase()
                          .replaceAll("_", " ")}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {format(transaction.transactionDate, "dd MMM")} ·{" "}
                      {transaction.category?.name ?? "No category"}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums">
                    {transaction.type === "INCOME" ||
                    transaction.type === "REFUND"
                      ? "+"
                      : "−"}
                    {money(transaction.amount.toString())}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-[var(--muted-foreground)]">
              No transactions in this financial month.
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Budget position</h2>
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                Overall
              </span>
            </div>
            {data.budgetAmount.isPositive() ? (
              <>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Remaining
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {money(data.budgetRemaining)}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] tabular-nums">
                    of {money(data.budgetAmount)}
                  </p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{
                      width: `${Math.min(100, data.summary.netExpenses.dividedBy(data.budgetAmount).times(100).toNumber())}%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-xl bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)]">
                No active budget yet. Add one after your baseline spending is
                visible.
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-bold">Accounts connected</h2>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {data.accounts.length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Manual bank, cash, card, wallet, and investment accounts.
            </p>
            <Link
              href="/accounts"
              className="mt-4 inline-block text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Manage accounts
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
