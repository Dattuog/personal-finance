import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleAlert,
  CircleCheckBig,
  CircleDollarSign,
  Gauge,
  Info,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  MessageCircleQuestion,
  PiggyBank,
  Plus,
  ReceiptIndianRupee,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { requireUser } from "@/lib/auth/require-user";
import { formatMoney } from "@/lib/money/decimal";
import { getInsightsDashboardData } from "@/modules/insights/dashboard-service";
import type { InsightReportOutput } from "@/modules/insights/schema";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/finance/metric-card";
import { buttonVariants } from "@/components/ui/button";
import {
  CashFlowTrendChart,
  CategorySpendingChart,
} from "@/components/charts/insights-charts";
import { GenerateInsightButton } from "@/components/insights/generate-insight-button";

export const metadata: Metadata = { title: "AI Insights" };

export default async function InsightsPage() {
  const user = await requireUser();
  const data = await getInsightsDashboardData(user.id);
  const money = (value: number | string) =>
    formatMoney(value, data.currencyCode, data.locale);
  const savingsRate = data.summary.savingsRate
    ? `${data.summary.savingsRate.times(100).toDecimalPlaces(1).toString()}%`
    : "—";
  const healthLabel = data.healthScore.label.replaceAll("_", " ");

  return (
    <div>
      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--primary-soft)] p-5 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Sparkles className="size-4" aria-hidden="true" />
              AI-powered financial clarity
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              See where your money goes—and what to do next
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted-foreground)]">
              Verified analytics explain your cash flow first. Optional AI turns
              those numbers into a plain-language monthly review without seeing
              account identifiers, raw notes, or personal details.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 backdrop-blur">
            <p className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
              Financial month
            </p>
            <p className="mt-1 font-bold tabular-nums">{data.periodLabel}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {data.transactionCount} recorded transaction
              {data.transactionCount === 1 ? "" : "s"} this period
            </p>
          </div>
        </div>
        <nav
          aria-label="Insights sections"
          className="mt-6 flex flex-wrap gap-2"
        >
          {[
            ["#ai-review", "AI review"],
            ["#cash-flow", "Cash flow"],
            ["#spending", "Spending"],
            ["#savings-plan", "Savings plan"],
            ["#methodology", "Methodology"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-xs font-semibold transition-colors duration-200 hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
            >
              {label}
            </a>
          ))}
        </nav>
      </section>

      {!data.hasAnyTransactions ? (
        <Card className="mt-7 border-dashed p-7 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <ChartNoAxesCombined className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold">
            Your insights need real data
          </h2>
          <p className="mx-auto mt-2 max-w-xl leading-7 text-[var(--muted-foreground)]">
            Add income and expense transactions first. FinPilot will build the
            graphs and saving scenarios from your records—never from sample or
            fabricated values.
          </p>
          <Link
            href="/transactions/new"
            className={`${buttonVariants({ variant: "primary" })} mt-5`}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add your first transaction
          </Link>
        </Card>
      ) : (
        <>
          <section aria-labelledby="insight-kpis" className="mt-7">
            <h2 id="insight-kpis" className="sr-only">
              Key insight metrics
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Financial health"
                value={
                  data.healthScore.score === null
                    ? "Insufficient data"
                    : `${data.healthScore.score}/100`
                }
                definition="An explainable score built only from available savings, budget, essential-spending, and recurring-cost data. Missing data is not counted as poor behaviour."
                icon={Gauge}
                detail={healthLabel}
              />
              <MetricCard
                label="Savings rate"
                value={savingsRate}
                definition="Cash surplus before investments divided by cleared income. Pending transactions are excluded."
                icon={PiggyBank}
                tone="income"
                detail="Calculated before investment contributions"
              />
              <MetricCard
                label="Cash after investing"
                value={money(
                  data.summary.cashRemainingAfterInvestments.toString(),
                )}
                definition="Cleared income minus net consumption expenses and investment contributions for this financial month."
                icon={WalletCards}
                tone={
                  data.summary.cashRemainingAfterInvestments.isNegative()
                    ? "expense"
                    : "income"
                }
                detail={comparisonText(
                  data.comparisons.cashRemaining,
                  "cash remaining",
                )}
              />
              <MetricCard
                label="Best saving scenario"
                value={
                  data.primarySavingImpact === null
                    ? "Review ready"
                    : money(data.primarySavingImpact)
                }
                definition="The largest calculated monthly review scenario currently available. It is an estimate, not a guaranteed saving."
                icon={Lightbulb}
                tone="investment"
                detail="Based on recorded and categorised activity"
              />
            </div>
          </section>

          <section
            id="ai-review"
            aria-labelledby="ai-review-title"
            className="mt-7 scroll-mt-24"
          >
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-5 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div className="flex gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <BrainCircuit className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-[var(--primary)] uppercase">
                      Optional explanation layer
                    </p>
                    <h2 id="ai-review-title" className="mt-1 text-xl font-bold">
                      AI monthly review
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                      AI explains verified metrics and must cite evidence keys.
                      Calculated totals always remain the source of truth.
                    </p>
                  </div>
                </div>
                <GenerateInsightButton
                  aiEnabled={data.aiEnabled}
                  hasReport={Boolean(data.latestReport)}
                />
              </div>
              {data.latestReport ? (
                <AIReport
                  report={data.latestReport.output}
                  generatedAt={formatInTimeZone(
                    data.latestReport.generatedAt,
                    data.timezone,
                    "d MMM yyyy, h:mm a",
                  )}
                  money={money}
                />
              ) : (
                <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                  <div>
                    <p className="font-semibold">
                      Your calculated insights are already available below.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                      Generate a review when you want AI to connect those facts
                      into a concise narrative and action list.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--success)]">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    Aggregated metrics only
                  </span>
                </div>
              )}
            </Card>
          </section>

          <section
            id="cash-flow"
            aria-labelledby="cash-flow-title"
            className="mt-7 scroll-mt-24"
          >
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">
                  Money movement
                </p>
                <h2
                  id="cash-flow-title"
                  className="mt-1 text-2xl font-bold tracking-tight"
                >
                  Income to cash remaining
                </h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Transfers are excluded; investments stay separate from spending.
              </p>
            </div>
            <Card className="p-4 sm:p-5">
              <div className="grid items-stretch gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
                <FlowMetric
                  label="Income"
                  value={money(data.summary.income.toString())}
                  tone="income"
                  icon={TrendingUp}
                />
                <FlowArrow />
                <FlowMetric
                  label="Net expenses"
                  value={money(data.summary.netExpenses.toString())}
                  tone="expense"
                  icon={ReceiptIndianRupee}
                />
                <FlowArrow />
                <FlowMetric
                  label="Invested"
                  value={money(data.summary.investments.toString())}
                  tone="investment"
                  icon={Target}
                />
                <FlowArrow />
                <FlowMetric
                  label={
                    data.summary.cashRemainingAfterInvestments.isNegative()
                      ? "Cash deficit"
                      : "Cash remaining"
                  }
                  value={money(
                    data.summary.cashRemainingAfterInvestments.abs().toString(),
                  )}
                  tone={
                    data.summary.cashRemainingAfterInvestments.isNegative()
                      ? "expense"
                      : "income"
                  }
                  icon={WalletCards}
                />
              </div>
            </Card>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_.75fr]">
              <Card className="min-w-0 p-4 sm:p-6">
                <div>
                  <h3 className="font-bold">Six-month cash-flow trend</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Compare income, consumption, and investing without mixing
                    their meanings.
                  </p>
                </div>
                <CashFlowTrendChart
                  data={data.trend}
                  currencyCode={data.currencyCode}
                  locale={data.locale}
                />
                <details className="mt-3 rounded-xl border border-[var(--border)]">
                  <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold">
                    View trend data table
                  </summary>
                  <div className="overflow-x-auto border-t border-[var(--border)]">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="bg-[var(--background)] text-[var(--muted-foreground)]">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Period</th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Income
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Expenses
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Invested
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {data.trend.map((point) => (
                          <tr key={point.periodLabel}>
                            <td className="px-4 py-3">{point.periodLabel}</td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {money(point.income)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {money(point.expenses)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {money(point.investments)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Spending forecast</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      A pace-based range, not a promise.
                    </p>
                  </div>
                  <TrendingDown
                    className="size-5 text-[var(--primary)]"
                    aria-hidden="true"
                  />
                </div>
                {data.forecast ? (
                  <div className="mt-6">
                    <p className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
                      Projected net expenses
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                      {money(data.forecast.projectedExpensesLow)}–
                      {money(data.forecast.projectedExpensesHigh)}
                    </p>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{ width: `${data.forecast.elapsedPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      {data.forecast.elapsedPercent}% of this financial month
                      elapsed · {data.forecast.confidence} confidence
                    </p>
                    <p className="mt-5 rounded-xl bg-[var(--background)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
                      Assumes the current spending pace continues. It does not
                      predict unrecorded bills, future income, or one-off
                      events.
                    </p>
                  </div>
                ) : (
                  <EmptyMiniState text="Add cleared expenses to create a pace-based forecast." />
                )}
              </Card>
            </div>
          </section>

          <section
            id="spending"
            aria-labelledby="spending-title"
            className="mt-7 scroll-mt-24"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--primary)]">
                Spending structure
              </p>
              <h2
                id="spending-title"
                className="mt-1 text-2xl font-bold tracking-tight"
              >
                What is consuming your money
              </h2>
            </div>
            <div className="mt-4 grid gap-5 xl:grid-cols-2">
              <Card className="p-5 sm:p-6">
                <h3 className="font-bold">Net spending by category</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Expenses minus refunds, grouped into the largest categories.
                </p>
                {data.categorySpending.length ? (
                  <>
                    <CategorySpendingChart
                      data={data.categorySpending}
                      currencyCode={data.currencyCode}
                      locale={data.locale}
                    />
                    <details className="mt-4 rounded-xl border border-[var(--border)]">
                      <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold">
                        View category data table
                      </summary>
                      <table className="w-full border-t border-[var(--border)] text-sm">
                        <thead className="sr-only">
                          <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {data.categorySpending.map((category) => (
                            <tr key={category.name}>
                              <td className="px-4 py-3">{category.name}</td>
                              <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                {money(category.value)}
                              </td>
                              <td className="px-4 py-3 text-right text-[var(--muted-foreground)] tabular-nums">
                                {category.share}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  </>
                ) : (
                  <EmptyMiniState text="No cleared category spending exists for this period." />
                )}
              </Card>

              <Card className="p-5 sm:p-6">
                <h3 className="font-bold">Essential versus flexible</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Category classifications reveal how much spending can
                  realistically change.
                </p>
                {data.spendingSplit.length ? (
                  <div className="mt-7 space-y-6">
                    {data.spendingSplit.map((item) => (
                      <div key={item.name}>
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                              {money(item.value)}
                            </p>
                          </div>
                          <p className="font-bold tabular-nums">
                            {item.share}%
                          </p>
                        </div>
                        <div
                          className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--muted)]"
                          role="progressbar"
                          aria-label={`${item.name} share`}
                          aria-valuenow={item.share}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={splitBarClass(item.tone)}
                            style={{ width: `${item.share}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="rounded-xl bg-[var(--background)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
                      “Unclassified” means the category needs an essential or
                      discretionary label before FinPilot can judge flexibility.
                    </p>
                  </div>
                ) : (
                  <EmptyMiniState text="Categorised expenses will reveal your essential and flexible split." />
                )}
              </Card>
            </div>
          </section>

          <section
            id="savings-plan"
            aria-labelledby="savings-plan-title"
            className="mt-7 scroll-mt-24"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">
                  Action plan
                </p>
                <h2
                  id="savings-plan-title"
                  className="mt-1 text-2xl font-bold tracking-tight"
                >
                  Practical ways to improve this month
                </h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Scenarios preserve essential spending and are never automatic
                actions.
              </p>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {data.opportunities.map((opportunity, index) => (
                <Card key={opportunity.key} className="p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className={opportunityIconClass(opportunity.tone)}>
                      {opportunity.tone === "positive" ? (
                        <ShieldCheck className="size-5" aria-hidden="true" />
                      ) : opportunity.tone === "attention" ? (
                        <CircleAlert className="size-5" aria-hidden="true" />
                      ) : (
                        <Lightbulb className="size-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
                            Priority {index + 1} · {opportunity.confidence}{" "}
                            confidence
                          </p>
                          <h3 className="mt-1 font-bold">
                            {opportunity.title}
                          </h3>
                        </div>
                        {opportunity.potentialMonthlyImpact !== null && (
                          <span className="rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-bold text-[var(--success)] tabular-nums">
                            Up to {money(opportunity.potentialMonthlyImpact)}
                            /month
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                        {opportunity.explanation}
                      </p>
                      <div className="mt-4 rounded-xl bg-[var(--background)] p-3.5">
                        <p className="flex items-center gap-2 text-xs font-bold">
                          <ListChecks
                            className="size-4 text-[var(--primary)]"
                            aria-hidden="true"
                          />
                          Next action
                        </p>
                        <p className="mt-1.5 text-sm leading-6">
                          {opportunity.action}
                        </p>
                      </div>
                      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--muted-foreground)]">
                        <Info
                          className="mt-0.5 size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        Evidence: {opportunity.evidence}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <Card className="p-5 sm:p-6">
                <h3 className="font-bold">Budget pressure</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Active budgets ranked by how much has been used.
                </p>
                {data.budget.items.length ? (
                  <div className="mt-6 space-y-5">
                    {data.budget.items.map((budget) => (
                      <div key={budget.id}>
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {budget.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                              {money(budget.spent)} of {money(budget.amount)}
                            </p>
                          </div>
                          <p className={budgetPercentClass(budget.status)}>
                            {budget.utilization}%
                          </p>
                        </div>
                        <div
                          className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--muted)]"
                          role="progressbar"
                          aria-label={`${budget.name} budget used`}
                          aria-valuenow={Math.min(100, budget.utilization)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={budgetBarClass(budget.status)}
                            style={{
                              width: `${Math.min(100, budget.utilization)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyMiniState text="No active budget data is available yet. Your spending insights still work without it." />
                )}
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Recurring-cost snapshot</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Active subscriptions converted to a monthly equivalent.
                    </p>
                  </div>
                  <ReceiptIndianRupee
                    className="size-5 text-[var(--primary)]"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-7 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[var(--background)] p-4">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Active services
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      {data.subscriptions.activeCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--background)] p-4">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Monthly equivalent
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {money(data.subscriptions.monthlyEquivalent)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-[var(--border)] p-4">
                  <p className="text-sm font-semibold">
                    Non-essential review pool
                  </p>
                  <p className="mt-1 text-lg font-bold text-[var(--accent)] tabular-nums">
                    {money(data.subscriptions.nonEssentialMonthlyEquivalent)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
                    This is the amount worth reviewing—not an instruction to
                    cancel every service.
                  </p>
                </div>
              </Card>
            </div>
          </section>
        </>
      )}

      <section
        id="methodology"
        aria-labelledby="methodology-title"
        className="mt-7 scroll-mt-24"
      >
        <Card className="p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
              <Info className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="methodology-title" className="font-bold">
                How these insights are calculated
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Pending and deleted transactions are excluded. Refunds reduce
                expenses. Transfers do not count as spending, and investments
                remain separate from ordinary consumption.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 md:grid-cols-3">
            <Definition
              term="Net expenses"
              description="Consumption expenses minus refunds."
            />
            <Definition
              term="Savings rate"
              description="Income minus net expenses, divided by income. Investments are not subtracted first."
            />
            <Definition
              term="Cash after investing"
              description="Income minus net expenses and investment contributions."
            />
          </dl>
          <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--muted-foreground)]">
            AI commentary is informational and may be incomplete. It is not tax,
            legal, investment, or regulated financial advice. Always verify
            important decisions against your actual obligations and records.
          </p>
        </Card>
      </section>
    </div>
  );
}

function comparisonText(value: number | null, subject: string) {
  if (value === null) return `No previous-period baseline for ${subject}`;
  if (value === 0) return `${subject} is unchanged from the previous period`;
  return `${subject} is ${Math.abs(value)}% ${value > 0 ? "higher" : "lower"} than the previous period`;
}

function FlowMetric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "investment";
  icon: typeof TrendingUp;
}) {
  const toneClass = {
    income: "text-[var(--income)]",
    expense: "text-[var(--expense)]",
    investment: "text-[var(--investment)]",
  }[tone];
  return (
    <div className="rounded-xl bg-[var(--background)] p-4">
      <Icon className={`size-4 ${toneClass}`} aria-hidden="true" />
      <p className="mt-3 text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className={`mt-1 font-bold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <span
      className="grid place-items-center text-[var(--muted-foreground)]"
      aria-hidden="true"
    >
      <ArrowRight className="hidden size-4 xl:block" />
      <ArrowDown className="size-4 xl:hidden" />
    </span>
  );
}

function EmptyMiniState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] p-5 text-sm leading-6 text-[var(--muted-foreground)]">
      {text}
    </div>
  );
}

function splitBarClass(tone: "essential" | "discretionary" | "unclassified") {
  return {
    essential: "h-full rounded-full bg-[var(--primary)]",
    discretionary: "h-full rounded-full bg-[var(--accent)]",
    unclassified: "h-full rounded-full bg-[var(--muted-foreground)]",
  }[tone];
}

function opportunityIconClass(tone: "positive" | "attention" | "neutral") {
  const color = {
    positive: "bg-[var(--success-soft)] text-[var(--success)]",
    attention: "bg-[var(--warning-soft)] text-[var(--warning)]",
    neutral: "bg-[var(--primary-soft)] text-[var(--primary)]",
  }[tone];
  return `grid size-10 shrink-0 place-items-center rounded-xl ${color}`;
}

function budgetPercentClass(status: "on_track" | "watch" | "over") {
  const color = {
    on_track: "text-[var(--success)]",
    watch: "text-[var(--warning)]",
    over: "text-[var(--destructive)]",
  }[status];
  return `text-sm font-bold tabular-nums ${color}`;
}

function budgetBarClass(status: "on_track" | "watch" | "over") {
  const color = {
    on_track: "bg-[var(--success)]",
    watch: "bg-[var(--warning)]",
    over: "bg-[var(--destructive)]",
  }[status];
  return `h-full rounded-full ${color}`;
}

function Definition({
  term,
  description,
}: {
  term: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--background)] p-4">
      <dt className="text-sm font-bold">{term}</dt>
      <dd className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
        {description}
      </dd>
    </div>
  );
}

function AIReport({
  report,
  generatedAt,
  money,
}: {
  report: InsightReportOutput;
  generatedAt: string;
  money: (value: number | string) => string;
}) {
  const savingRange = (minimum: number | null, maximum: number | null) => {
    if (minimum === null || maximum === null) return null;
    return Math.abs(minimum - maximum) < 0.01
      ? money(minimum)
      : `${money(minimum)}–${money(maximum)}`;
  };

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <section
        aria-labelledby="ai-monthly-overview"
        className="rounded-2xl border border-[var(--border)] bg-[var(--primary-soft)] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--primary)]">
              <CircleDollarSign className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="ai-monthly-overview" className="font-bold">
                Monthly overview
              </h3>
              <p className="mt-1 max-w-4xl text-sm leading-7">
                {report.executiveSummary}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
            Generated {generatedAt}
          </span>
        </div>
      </section>

      {report.biggestExpenses.length > 0 && (
        <section
          aria-labelledby="ai-biggest-expenses"
          className="rounded-2xl border border-[var(--border)] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <ScanSearch className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="ai-biggest-expenses" className="font-bold">
                Where your money went
              </h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                The categories with the greatest effect on ordinary consumption.
              </p>
            </div>
          </div>
          <div className="mt-4 divide-y divide-[var(--border)]">
            {report.biggestExpenses.map((expense) => (
              <article
                key={expense.categoryKey}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold">{expense.categoryName}</h4>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                      {expense.explanation}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <span className="font-bold tabular-nums">
                      {money(expense.amount)}
                    </span>
                    <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-semibold tabular-nums">
                      {expense.percentageOfSpending}%
                    </span>
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-semibold capitalize">
                      {expense.necessity.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section
          aria-labelledby="ai-protected-expenses"
          className="rounded-2xl border border-[var(--border)] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="ai-protected-expenses" className="font-bold">
                What appears necessary
              </h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Important costs not to cut without context.
              </p>
            </div>
          </div>
          {report.protectedExpenses.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {report.protectedExpenses.map((expense) => (
                <li
                  key={expense.categoryKey}
                  className="rounded-xl bg-[var(--background)] p-3.5 text-sm leading-6"
                >
                  {expense.reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
              The available category data was not sufficient to identify a
              protected expense.
            </p>
          )}
        </section>

        <section
          aria-labelledby="ai-overspending"
          className="rounded-2xl border border-[var(--border)] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]">
              <CircleAlert className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="ai-overspending" className="font-bold">
                Where you may be overspending
              </h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Only evidence-backed areas are shown.
              </p>
            </div>
          </div>
          {report.overspendingAreas.length > 0 ? (
            <div className="mt-4 space-y-3">
              {report.overspendingAreas.map((area) => (
                <article
                  key={`${area.categoryKey}-${area.reason}`}
                  className="rounded-xl bg-[var(--background)] p-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold capitalize">
                      {area.categoryKey.replaceAll("-", " ")}
                    </h4>
                    <span className="text-xs font-semibold text-[var(--warning)] capitalize">
                      {area.severity} priority
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6">{area.reason}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
                    Evidence: {area.evidence}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-[var(--success-soft)] p-3.5 text-sm leading-6 text-[var(--success)]">
              No meaningful overspending problem was supported by this month’s
              verified data.
            </p>
          )}
        </section>
      </div>

      {report.savingsOpportunities.length > 0 && (
        <section
          aria-labelledby="ai-saving-opportunities"
          className="rounded-2xl border border-[var(--border)] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]">
              <Lightbulb className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="ai-saving-opportunities" className="font-bold">
                Best saving opportunities
              </h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Ranked actions that preserve essential needs.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {[...report.savingsOpportunities]
              .sort((left, right) => left.rank - right.rank)
              .map((opportunity) => {
                const range = savingRange(
                  opportunity.estimatedMonthlySavingMin,
                  opportunity.estimatedMonthlySavingMax,
                );
                return (
                  <article
                    key={`${opportunity.rank}-${opportunity.title}`}
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold tracking-wide text-[var(--primary)] uppercase">
                          Priority {opportunity.rank}
                        </p>
                        <h4 className="mt-1 font-semibold">
                          {opportunity.title}
                        </h4>
                      </div>
                      {range && (
                        <span className="shrink-0 rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-bold text-[var(--success)] tabular-nums">
                          {range}/month
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {opportunity.reason}
                    </p>
                    <div className="mt-3 rounded-xl bg-[var(--background)] p-3">
                      <p className="text-xs font-bold">Action</p>
                      <p className="mt-1 text-sm leading-6">
                        {opportunity.action}
                      </p>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-[var(--muted-foreground)] capitalize">
                      {opportunity.difficulty} difficulty · {opportunity.impact}{" "}
                      impact
                    </p>
                  </article>
                );
              })}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section
          aria-labelledby="ai-positive-habits"
          className="rounded-2xl bg-[var(--success-soft)] p-4 text-[var(--success)] sm:p-5"
        >
          <div className="flex items-center gap-2">
            <CircleCheckBig className="size-5" aria-hidden="true" />
            <h3 id="ai-positive-habits" className="font-bold">
              You’re doing well
            </h3>
          </div>
          {report.positiveHabits.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm leading-6">
              {report.positiveHabits.map((habit) => (
                <li key={habit} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{habit}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6">
              More history is needed to identify a supported positive trend.
            </p>
          )}
        </section>

        <section
          aria-labelledby="ai-next-month"
          className="rounded-2xl border border-[var(--border)] p-4 sm:p-5"
        >
          <div className="flex items-center gap-2">
            <Target
              className="size-5 text-[var(--primary)]"
              aria-hidden="true"
            />
            <h3 id="ai-next-month" className="font-bold">
              Next month focus
            </h3>
          </div>
          {report.nextMonthTargets.length > 0 ? (
            <ol className="mt-3 space-y-3">
              {report.nextMonthTargets.map((item, index) => (
                <li
                  key={`${item.title}-${item.target}`}
                  className="grid grid-cols-[auto_1fr] gap-3 rounded-xl bg-[var(--background)] p-3.5"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold">{item.title}</h4>
                    <p className="mt-0.5 text-sm font-bold text-[var(--primary)]">
                      {item.target}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      {item.reason}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
              No responsible target can be set from the available data yet.
            </p>
          )}
        </section>
      </div>

      {report.questionsForUser.length > 0 && (
        <section
          aria-labelledby="ai-context-questions"
          className="rounded-2xl border border-dashed border-[var(--border)] p-4 sm:p-5"
        >
          <div className="flex items-center gap-2">
            <MessageCircleQuestion
              className="size-5 text-[var(--primary)]"
              aria-hidden="true"
            />
            <h3 id="ai-context-questions" className="font-bold">
              Context that would improve this review
            </h3>
          </div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--muted-foreground)]">
            {report.questionsForUser.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs leading-5 text-[var(--muted-foreground)]">
        {report.disclaimer}
      </p>
    </div>
  );
}
