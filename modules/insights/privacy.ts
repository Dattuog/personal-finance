import Decimal from "decimal.js";
import type { FinancialSummary } from "@/modules/analytics/types";
import type { ExpenseEssentiality } from "./essentiality";

export interface SafeInsightTransaction {
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "INVESTMENT" | "REFUND";
  amount: Decimal.Value;
  categoryKey: string | null;
  categoryName: string | null;
  parentCategoryKey?: string | null;
  parentCategoryName?: string | null;
  essentiality?: ExpenseEssentiality | null;
}

export interface SafeInsightSubscription {
  name: string;
  monthlyAmount: Decimal.Value;
  billingFrequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  usageStatus: "active" | "low" | "inactive" | "unknown";
  essentiality: "essential" | "nonessential" | "unknown";
}

export interface SafeInsightBudget {
  name: string;
  spent: number;
  amount: number;
  utilization: number;
  status: "on_track" | "watch" | "over";
}

export interface SafeSavingsCandidate {
  key: string;
  categoryKey: string | null;
  title: string;
  reason: string;
  action: string;
  evidenceMetricKeys: readonly string[];
  estimatedMonthlySavingMin: number | null;
  estimatedMonthlySavingMax: number | null;
  confidence: "low" | "medium" | "high";
  limitation: string;
}

export interface InsightPayload {
  schemaVersion: "2";
  period: {
    start: string;
    end: string;
    month: string;
    year: number;
  };
  currency: string;
  income: {
    total: number;
    sources: { name: string; amount: number }[];
  };
  consumption: {
    total: number;
    categories: {
      key: string;
      name: string;
      amount: number;
      percentageOfConsumption: number;
      previousMonthAmount: number | null;
      changeAmount: number | null;
      changePercentage: number | null;
      essentiality: ExpenseEssentiality;
      subcategories: { key: string; name: string; amount: number }[];
    }[];
  };
  subscriptions: {
    name: string;
    monthlyAmount: number;
    billingFrequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    usageStatus: "active" | "low" | "inactive" | "unknown";
    essentiality: "essential" | "nonessential" | "unknown";
  }[];
  familySupport: { amount: number };
  investments: {
    total: number;
    rate: number | null;
    items: { type: string; amount: number }[];
  };
  savings: {
    amount: number;
    rate: number | null;
    leftoverCashAfterInvesting: number;
  };
  transfers: { total: number };
  previousMonth: {
    income: number;
    consumption: number;
    investments: number;
    savings: number;
    savingsRate: number | null;
  } | null;
  budgetStatus: SafeInsightBudget[];
  unusualChanges: {
    categoryKey: string;
    categoryName: string;
    currentAmount: number;
    previousAmount: number;
    changeAmount: number;
    changePercentage: number | null;
    reason: string;
  }[];
  candidateSavingsOpportunities: SafeSavingsCandidate[];
  healthScore: number | null;
}

interface CategoryAccumulator {
  key: string;
  name: string;
  amount: Decimal;
  essentialities: Set<ExpenseEssentiality>;
  subcategories: Map<string, { name: string; amount: Decimal }>;
}

const ZERO = new Decimal(0);
const foodCategoryKeys = new Set([
  "food",
  "groceries",
  "dining-out",
  "restaurants",
  "food-delivery",
  "delivery",
  "office-meals",
]);
const promptInjectionPattern =
  /(?:ignore (?:all |the )?(?:previous|prior) instructions|system prompt|developer message|reveal (?:the )?(?:secret|credential)|act as (?:the )?system)/iu;
const emailOrUpiPattern =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b[A-Z0-9._-]+@[A-Z]{2,}\b/giu;
const longNumberPattern = /\b(?:\d[ -]?){10,19}\b/gu;

export function sanitizeAnalyticsLabel(value: string, fallback: string) {
  const normalized = value
    .replace(/[\u0000-\u001f\u007f-\u009f]/gu, " ")
    .replace(emailOrUpiPattern, "[redacted identifier]")
    .replace(longNumberPattern, "[redacted number]")
    .replace(/\s+/gu, " ")
    .trim();
  if (!normalized || promptInjectionPattern.test(normalized)) return fallback;
  return normalized.slice(0, 80);
}

const money = (value: Decimal.Value) =>
  new Decimal(value).toDecimalPlaces(2).toNumber();
const percent = (value: Decimal.Value) =>
  new Decimal(value).toDecimalPlaces(1).toNumber();

function signedAmount(transaction: SafeInsightTransaction) {
  const amount = new Decimal(transaction.amount);
  return transaction.type === "REFUND" ? amount.negated() : amount;
}

function categoryIdentity(transaction: SafeInsightTransaction) {
  const categoryKey = transaction.categoryKey ?? "uncategorised";
  const categoryName = sanitizeAnalyticsLabel(
    transaction.categoryName ?? "Uncategorised",
    "Custom category",
  );
  if (foodCategoryKeys.has(categoryKey)) return { key: "food", name: "Food" };
  if (transaction.parentCategoryKey && transaction.parentCategoryName)
    return {
      key: transaction.parentCategoryKey,
      name: sanitizeAnalyticsLabel(
        transaction.parentCategoryName,
        "Custom category",
      ),
    };
  return { key: categoryKey, name: categoryName };
}

function aggregateCategories(
  transactions: readonly SafeInsightTransaction[],
): Map<string, CategoryAccumulator> {
  const totals = new Map<string, CategoryAccumulator>();

  for (const transaction of transactions) {
    if (transaction.type !== "EXPENSE" && transaction.type !== "REFUND")
      continue;
    if (transaction.categoryKey === "family-support") continue;

    const identity = categoryIdentity(transaction);
    const existing = totals.get(identity.key) ?? {
      ...identity,
      amount: ZERO,
      essentialities: new Set<ExpenseEssentiality>(),
      subcategories: new Map<string, { name: string; amount: Decimal }>(),
    };
    const amount = signedAmount(transaction);
    existing.amount = existing.amount.plus(amount);
    if (transaction.essentiality)
      existing.essentialities.add(transaction.essentiality);

    const childKey = transaction.categoryKey ?? "uncategorised";
    const childName = sanitizeAnalyticsLabel(
      transaction.categoryName ?? "Uncategorised",
      "Custom category",
    );
    if (identity.key !== childKey) {
      const child = existing.subcategories.get(childKey) ?? {
        name: childName,
        amount: ZERO,
      };
      child.amount = child.amount.plus(amount);
      existing.subcategories.set(childKey, child);
    }
    totals.set(identity.key, existing);
  }

  return totals;
}

function groupedAmounts(
  transactions: readonly SafeInsightTransaction[],
  type: "INCOME" | "INVESTMENT",
) {
  const totals = new Map<string, Decimal>();
  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    const name = sanitizeAnalyticsLabel(
      transaction.categoryName ?? "Uncategorised",
      "Custom category",
    );
    totals.set(name, (totals.get(name) ?? ZERO).plus(transaction.amount));
  }
  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount: money(amount) }))
    .sort((left, right) => right.amount - left.amount);
}

function categoryEssentiality(
  essentialities: ReadonlySet<ExpenseEssentiality>,
): ExpenseEssentiality {
  if (essentialities.size === 1)
    return essentialities.values().next().value ?? "unknown";
  return essentialities.size > 1 ? "mixed" : "unknown";
}

function percentageChange(current: Decimal.Value, previous: Decimal.Value) {
  const baseline = new Decimal(previous);
  if (baseline.isZero()) return null;
  return percent(
    new Decimal(current).minus(baseline).dividedBy(baseline).times(100),
  );
}

export function buildPrivacyFilteredInsightPayload(input: {
  period: { start: Date; end: Date; month: string; year: number };
  currencyCode: string;
  summary: FinancialSummary;
  previousSummary: FinancialSummary;
  hasPreviousMonthData: boolean;
  currentTransactions: readonly SafeInsightTransaction[];
  previousTransactions: readonly SafeInsightTransaction[];
  subscriptions: readonly SafeInsightSubscription[];
  budgets: readonly SafeInsightBudget[];
  healthScore?: number | null;
  opportunities?: readonly SafeSavingsCandidate[];
}): InsightPayload {
  const currentCategories = aggregateCategories(input.currentTransactions);
  const previousCategories = aggregateCategories(input.previousTransactions);
  const ordinaryConsumption = Decimal.max(
    input.summary.netExpenses.minus(input.summary.familySupport),
    ZERO,
  );
  const previousConsumption = Decimal.max(
    input.previousSummary.netExpenses.minus(
      input.previousSummary.familySupport,
    ),
    ZERO,
  );

  const categories = [...currentCategories.values()]
    .filter((category) => category.amount.greaterThan(0))
    .map((category) => {
      const previous = previousCategories.get(category.key)?.amount ?? ZERO;
      const change = category.amount.minus(previous);
      return {
        key: category.key,
        name: category.name,
        amount: money(category.amount),
        percentageOfConsumption: ordinaryConsumption.greaterThan(0)
          ? percent(category.amount.dividedBy(ordinaryConsumption).times(100))
          : 0,
        previousMonthAmount: input.hasPreviousMonthData
          ? money(previous)
          : null,
        changeAmount: input.hasPreviousMonthData ? money(change) : null,
        changePercentage: input.hasPreviousMonthData
          ? percentageChange(category.amount, previous)
          : null,
        essentiality: categoryEssentiality(category.essentialities),
        subcategories: [...category.subcategories.entries()]
          .filter(([, child]) => child.amount.greaterThan(0))
          .map(([key, child]) => ({
            key,
            name: child.name,
            amount: money(child.amount),
          }))
          .sort((left, right) => right.amount - left.amount),
      };
    })
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 12);

  const unusualChanges = categories
    .filter((category) => {
      if (
        category.previousMonthAmount === null ||
        category.changeAmount === null
      )
        return false;
      if (category.previousMonthAmount === 0) return category.amount >= 1000;
      return (
        Math.abs(category.changePercentage ?? 0) >= 25 &&
        Math.abs(category.changeAmount) >= 500
      );
    })
    .map((category) => ({
      categoryKey: category.key,
      categoryName: category.name,
      currentAmount: category.amount,
      previousAmount: category.previousMonthAmount ?? 0,
      changeAmount: category.changeAmount ?? 0,
      changePercentage: category.changePercentage,
      reason:
        category.previousMonthAmount === 0
          ? "This category had no recorded spending in the previous month."
          : `Verified category spending changed by ${category.changePercentage}% from the previous month.`,
    }))
    .sort(
      (left, right) =>
        Math.abs(right.changeAmount) - Math.abs(left.changeAmount),
    )
    .slice(0, 5);

  return {
    schemaVersion: "2",
    period: {
      start: input.period.start.toISOString(),
      end: input.period.end.toISOString(),
      month: input.period.month,
      year: input.period.year,
    },
    currency: input.currencyCode,
    income: {
      total: money(input.summary.income),
      sources: groupedAmounts(input.currentTransactions, "INCOME"),
    },
    consumption: {
      total: money(ordinaryConsumption),
      categories,
    },
    subscriptions: input.subscriptions
      .map((subscription) => ({
        ...subscription,
        name: sanitizeAnalyticsLabel(subscription.name, "Subscription"),
        monthlyAmount: money(subscription.monthlyAmount),
      }))
      .sort((left, right) => right.monthlyAmount - left.monthlyAmount),
    familySupport: { amount: money(input.summary.familySupport) },
    investments: {
      total: money(input.summary.investments),
      rate: input.summary.investmentRate
        ? percent(input.summary.investmentRate.times(100))
        : null,
      items: groupedAmounts(input.currentTransactions, "INVESTMENT").map(
        ({ name, amount }) => ({ type: name, amount }),
      ),
    },
    savings: {
      amount: money(
        Decimal.max(input.summary.cashSurplusBeforeInvestments, ZERO),
      ),
      rate: input.summary.savingsRate
        ? percent(input.summary.savingsRate.times(100))
        : null,
      leftoverCashAfterInvesting: money(
        input.summary.cashRemainingAfterInvestments,
      ),
    },
    transfers: { total: money(input.summary.transfers) },
    previousMonth: input.hasPreviousMonthData
      ? {
          income: money(input.previousSummary.income),
          consumption: money(previousConsumption),
          investments: money(input.previousSummary.investments),
          savings: money(
            Decimal.max(
              input.previousSummary.cashSurplusBeforeInvestments,
              ZERO,
            ),
          ),
          savingsRate: input.previousSummary.savingsRate
            ? percent(input.previousSummary.savingsRate.times(100))
            : null,
        }
      : null,
    budgetStatus: input.budgets.map((budget) => ({
      ...budget,
      name: sanitizeAnalyticsLabel(budget.name, "Budget"),
    })),
    unusualChanges,
    candidateSavingsOpportunities: [...(input.opportunities ?? [])],
    healthScore: input.healthScore ?? null,
  };
}
