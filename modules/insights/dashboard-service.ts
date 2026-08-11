import "server-only";

import Decimal from "decimal.js";
import { subMonths } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db/client";
import { getMonthRange, type MonthRange } from "@/lib/dates/month-boundary";
import { calculateFinancialSummary } from "@/modules/analytics/calculate-summary";
import type { AnalyticsTransaction } from "@/modules/analytics/types";
import {
  defaultExpenseEssentiality,
  type ExpenseEssentiality,
} from "./essentiality";
import {
  buildPrivacyFilteredInsightPayload,
  type SafeInsightSubscription,
  type SafeInsightTransaction,
} from "./privacy";
import { insightReportSchema } from "./schema";
import {
  calculateCategorySpending,
  calculateInsightHealthScore,
  calculateSavingsOpportunities,
  calculateSpendingForecast,
  calculateSpendingSplit,
  monthlyEquivalent,
  type InsightTransaction,
} from "./dashboard-analytics";
import type { BudgetProgressItem, MonthlyTrendPoint } from "./dashboard-types";

const ZERO = new Decimal(0);

const databaseDate = (date: Date) =>
  new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);

export function insightPeriodDates(range: MonthRange) {
  return {
    periodStart: databaseDate(range.start),
    periodEnd: databaseDate(range.end),
  };
}

const number = (value: Decimal.Value) =>
  new Decimal(value).toDecimalPlaces(2).toNumber();

const percentChange = (current: Decimal.Value, previous: Decimal.Value) => {
  const baseline = new Decimal(previous);
  if (baseline.isZero()) return null;
  return new Decimal(current)
    .minus(baseline)
    .dividedBy(baseline)
    .times(100)
    .toDecimalPlaces(1)
    .toNumber();
};

export async function getInsightsDashboardData(
  userId: string,
  instant = new Date(),
) {
  const profile = await db.userProfile.findUnique({ where: { userId } });
  const timezone = profile?.timezone ?? "Asia/Kolkata";
  const locale = profile?.locale ?? "en-IN";
  const currencyCode = profile?.currencyCode ?? "INR";
  const monthStartDay = profile?.financialMonthStartDay ?? 1;
  const periods = Array.from({ length: 6 }, (_, index) =>
    getMonthRange(subMonths(instant, 5 - index), timezone, monthStartDay),
  );
  const currentRange =
    periods.at(-1) ?? getMonthRange(instant, timezone, monthStartDay);
  const insightDates = insightPeriodDates(currentRange);

  const [
    transactions,
    budgets,
    subscriptions,
    essentialityOverrides,
    storedReport,
  ] = await Promise.all([
    db.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: {
          gte: periods[0]?.start ?? currentRange.start,
          lte: currentRange.end,
        },
      },
      include: { category: { include: { parent: true } } },
      orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
    }),
    db.budget.findMany({
      where: {
        userId,
        isActive: true,
        startDate: { lte: currentRange.end },
        OR: [{ endDate: null }, { endDate: { gte: currentRange.start } }],
      },
      include: { category: true },
      orderBy: { amount: "desc" },
    }),
    db.subscription.findMany({
      where: { userId, status: { in: ["ACTIVE", "TRIAL"] } },
    }),
    db.categoryEssentialityOverride.findMany({ where: { userId } }),
    db.insightReport.findFirst({
      where: {
        userId,
        periodStart: insightDates.periodStart,
        periodEnd: insightDates.periodEnd,
        status: "COMPLETED",
      },
      orderBy: { generatedAt: "desc" },
    }),
  ]);

  const asAnalyticsTransaction = (
    transaction: (typeof transactions)[number],
  ): AnalyticsTransaction => ({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount.toString(),
    date: transaction.transactionDate,
    deletedAt: transaction.deletedAt,
    status: transaction.status,
    categorySlug: transaction.category?.slug ?? null,
    necessity: transaction.category?.necessity ?? null,
    costBehaviour: transaction.category?.costBehaviour ?? null,
    isKnownRecurring: transaction.isRecurringGenerated,
  });
  const essentialityOverrideByCategory = new Map(
    essentialityOverrides.map((override) => [
      override.categoryId,
      override.essentiality.toLocaleLowerCase() as ExpenseEssentiality,
    ]),
  );
  const asSafeInsightTransaction = (
    transaction: (typeof transactions)[number],
  ): SafeInsightTransaction | null => {
    if (transaction.status === "PENDING" || transaction.type === "ADJUSTMENT")
      return null;
    const category = transaction.category;
    const categoryKey = category?.slug ?? null;
    return {
      type: transaction.type,
      amount: transaction.amount.toString(),
      categoryKey,
      categoryName: category?.name ?? null,
      parentCategoryKey: category?.parent?.slug ?? null,
      parentCategoryName: category?.parent?.name ?? null,
      essentiality: category
        ? (essentialityOverrideByCategory.get(category.id) ??
          defaultExpenseEssentiality({
            key: category.slug,
            necessity: category.necessity,
          }))
        : "unknown",
    };
  };
  const inRange = (date: Date, range: MonthRange) =>
    date >= range.start && date <= range.end;

  const periodSummaries = periods.map((range) => {
    const periodTransactions = transactions.filter((transaction) =>
      inRange(transaction.transactionDate, range),
    );
    return {
      range,
      transactions: periodTransactions,
      summary: calculateFinancialSummary(
        periodTransactions.map(asAnalyticsTransaction),
      ),
    };
  });
  const currentPeriod = periodSummaries.at(-1);
  const previousPeriod = periodSummaries.at(-2);
  const currentSummary =
    currentPeriod?.summary ?? calculateFinancialSummary([]);
  const previousSummary =
    previousPeriod?.summary ?? calculateFinancialSummary([]);
  const currentTransactions = currentPeriod?.transactions ?? [];

  const trend: MonthlyTrendPoint[] = periodSummaries.map(
    ({ range, summary }) => ({
      label: formatInTimeZone(range.end, timezone, "MMM"),
      periodLabel: `${formatInTimeZone(range.start, timezone, "d MMM")} – ${formatInTimeZone(range.end, timezone, "d MMM")}`,
      income: number(summary.income),
      expenses: number(summary.netExpenses),
      investments: number(summary.investments),
      cashRemaining: number(summary.cashRemainingAfterInvestments),
    }),
  );

  const insightTransactions: InsightTransaction[] = currentTransactions.map(
    (transaction) => ({
      type: transaction.type,
      amount: transaction.amount.toString(),
      status: transaction.status,
      deletedAt: transaction.deletedAt,
      categoryKey: transaction.category?.slug ?? null,
      categoryName: transaction.category?.name ?? null,
    }),
  );
  const categorySpending = calculateCategorySpending(insightTransactions);
  const spendingSplit = calculateSpendingSplit(currentSummary);
  const budgetAmount = budgets.reduce(
    (sum, budget) => sum.plus(budget.amount.toString()),
    ZERO,
  );
  const budgetUtilization = budgetAmount.greaterThan(0)
    ? currentSummary.netExpenses.dividedBy(budgetAmount)
    : null;

  const categorySpend = (categoryId: string | null) => {
    if (!categoryId) return Decimal.max(currentSummary.netExpenses, ZERO);
    return currentTransactions.reduce((sum, transaction) => {
      if (
        transaction.status === "PENDING" ||
        transaction.categoryId !== categoryId ||
        (transaction.type !== "EXPENSE" && transaction.type !== "REFUND")
      )
        return sum;
      const amount = new Decimal(transaction.amount.toString());
      return transaction.type === "REFUND"
        ? sum.minus(amount)
        : sum.plus(amount);
    }, ZERO);
  };
  const budgetProgress: BudgetProgressItem[] = budgets
    .map((budget) => {
      const spent = Decimal.max(categorySpend(budget.categoryId), ZERO);
      const amount = new Decimal(budget.amount.toString());
      const utilization = amount.isZero() ? ZERO : spent.dividedBy(amount);
      return {
        id: budget.id,
        name: budget.category?.name ?? budget.name,
        spent: number(spent),
        amount: number(amount),
        utilization: utilization.times(100).toDecimalPlaces(1).toNumber(),
        status: (utilization.greaterThan(1)
          ? "over"
          : utilization.greaterThanOrEqualTo(0.8)
            ? "watch"
            : "on_track") as BudgetProgressItem["status"],
      };
    })
    .sort((left, right) => right.utilization - left.utilization)
    .slice(0, 5);

  const subscriptionMonthly = subscriptions.reduce(
    (sum, subscription) =>
      sum.plus(
        monthlyEquivalent(
          subscription.amount.toString(),
          subscription.billingFrequency,
        ),
      ),
    ZERO,
  );
  const nonEssentialSubscriptionMonthly = subscriptions.reduce(
    (sum, subscription) =>
      subscription.isEssential
        ? sum
        : sum.plus(
            monthlyEquivalent(
              subscription.amount.toString(),
              subscription.billingFrequency,
            ),
          ),
    ZERO,
  );
  const healthScore = calculateInsightHealthScore({
    summary: currentSummary,
    budgetUtilization,
    subscriptionMonthly,
  });
  const opportunities = calculateSavingsOpportunities({
    summary: currentSummary,
    categories: categorySpending,
    nonEssentialSubscriptionMonthly,
    budgetUtilization,
  });
  const forecast = calculateSpendingForecast({
    netExpenses: currentSummary.netExpenses,
    periodStart: currentRange.start,
    periodEnd: currentRange.end,
    instant,
  });
  const parsedReport = storedReport?.structuredOutput
    ? insightReportSchema.safeParse(storedReport.structuredOutput)
    : null;
  const currentSafeTransactions = currentTransactions
    .map(asSafeInsightTransaction)
    .filter((transaction): transaction is SafeInsightTransaction =>
      Boolean(transaction),
    );
  const previousSafeTransactions = (previousPeriod?.transactions ?? [])
    .map(asSafeInsightTransaction)
    .filter((transaction): transaction is SafeInsightTransaction =>
      Boolean(transaction),
    );
  const subscriptionAnalytics: SafeInsightSubscription[] = subscriptions.map(
    (subscription) => {
      const lastUsedAt = subscription.lastUsedAt;
      const daysSinceUse = lastUsedAt
        ? Math.max(
            0,
            (currentRange.end.getTime() - lastUsedAt.getTime()) /
              (24 * 60 * 60 * 1000),
          )
        : null;
      return {
        name: subscription.name,
        monthlyAmount: number(
          monthlyEquivalent(
            subscription.amount.toString(),
            subscription.billingFrequency,
          ),
        ),
        billingFrequency: subscription.billingFrequency,
        usageStatus:
          daysSinceUse === null
            ? "unknown"
            : daysSinceUse <= 45
              ? "active"
              : daysSinceUse <= 90
                ? "low"
                : "inactive",
        essentiality: subscription.isEssential ? "essential" : "nonessential",
      };
    },
  );
  const insightPayload = buildPrivacyFilteredInsightPayload({
    period: {
      start: currentRange.start,
      end: currentRange.end,
      month: formatInTimeZone(currentRange.start, timezone, "MMMM"),
      year: Number(formatInTimeZone(currentRange.start, timezone, "yyyy")),
    },
    currencyCode,
    summary: currentSummary,
    previousSummary,
    hasPreviousMonthData: (previousPeriod?.transactions.length ?? 0) > 0,
    currentTransactions: currentSafeTransactions,
    previousTransactions: previousSafeTransactions,
    subscriptions: subscriptionAnalytics,
    budgets: budgetProgress.map(
      ({ name, spent, amount, utilization, status }) => ({
        name,
        spent,
        amount,
        utilization,
        status,
      }),
    ),
    healthScore: healthScore.score,
    opportunities: opportunities.map((opportunity) => ({
      key: opportunity.key,
      categoryKey: opportunity.categoryKey,
      title: opportunity.title,
      reason: opportunity.explanation,
      action: opportunity.action,
      evidenceMetricKeys: opportunity.evidenceMetricKeys,
      estimatedMonthlySavingMin: opportunity.potentialMonthlyImpact,
      estimatedMonthlySavingMax: opportunity.potentialMonthlyImpact,
      confidence: opportunity.confidence,
      limitation:
        "This is a review scenario based on recorded data, not a guaranteed saving.",
    })),
  });

  return {
    aiEnabled: profile?.aiEnabled ?? false,
    currencyCode,
    locale,
    timezone,
    range: currentRange,
    periodLabel: `${formatInTimeZone(currentRange.start, timezone, "d MMM yyyy")} – ${formatInTimeZone(currentRange.end, timezone, "d MMM yyyy")}`,
    hasAnyTransactions: transactions.length > 0,
    hasCurrentTransactions: currentTransactions.length > 0,
    transactionCount: currentTransactions.length,
    summary: currentSummary,
    comparisons: {
      income: percentChange(currentSummary.income, previousSummary.income),
      expenses: percentChange(
        currentSummary.netExpenses,
        previousSummary.netExpenses,
      ),
      cashRemaining: percentChange(
        currentSummary.cashRemainingAfterInvestments,
        previousSummary.cashRemainingAfterInvestments,
      ),
    },
    trend,
    categorySpending,
    spendingSplit,
    budget: {
      total: number(budgetAmount),
      spent: number(currentSummary.netExpenses),
      remaining: number(
        Decimal.max(budgetAmount.minus(currentSummary.netExpenses), ZERO),
      ),
      utilization: budgetUtilization
        ? budgetUtilization.times(100).toDecimalPlaces(1).toNumber()
        : null,
      items: budgetProgress,
    },
    subscriptions: {
      activeCount: subscriptions.length,
      monthlyEquivalent: number(subscriptionMonthly),
      nonEssentialMonthlyEquivalent: number(nonEssentialSubscriptionMonthly),
    },
    healthScore,
    opportunities,
    forecast,
    insightPayload,
    primarySavingImpact:
      opportunities.reduce(
        (largest, opportunity) =>
          Math.max(largest, opportunity.potentialMonthlyImpact ?? 0),
        0,
      ) || null,
    latestReport:
      parsedReport?.success && storedReport
        ? {
            output: parsedReport.data,
            generatedAt: storedReport.generatedAt ?? storedReport.updatedAt,
          }
        : null,
  };
}
