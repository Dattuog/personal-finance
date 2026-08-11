import Decimal from "decimal.js";
import { calculateHealthScore } from "@/modules/analytics/health-score";
import type { FinancialSummary } from "@/modules/analytics/types";
import type {
  CategorySpendingPoint,
  SavingsOpportunity,
  SpendingForecast,
  SpendingSplitPoint,
} from "./dashboard-types";

export interface InsightTransaction {
  type:
    "INCOME" | "EXPENSE" | "TRANSFER" | "INVESTMENT" | "REFUND" | "ADJUSTMENT";
  amount: Decimal.Value;
  status: "PENDING" | "CLEARED" | "RECONCILED";
  deletedAt?: Date | null;
  categoryKey?: string | null;
  categoryName?: string | null;
}

const ZERO = new Decimal(0);

const moneyNumber = (value: Decimal.Value) =>
  new Decimal(value).toDecimalPlaces(2).toNumber();

const boundedRatio = (value: Decimal.Value, minimum = 0, maximum = 1) =>
  Decimal.min(maximum, Decimal.max(minimum, value));

export function calculateCategorySpending(
  transactions: readonly InsightTransaction[],
  maximumSlices = 4,
): CategorySpendingPoint[] {
  const categoryTotals = new Map<string, { name: string; value: Decimal }>();

  for (const transaction of transactions) {
    if (transaction.deletedAt || transaction.status === "PENDING") continue;
    if (transaction.type !== "EXPENSE" && transaction.type !== "REFUND")
      continue;

    const name = transaction.categoryName?.trim() || "Uncategorised";
    const key = transaction.categoryKey?.trim() || "uncategorised";
    const amount = new Decimal(transaction.amount);
    const signedAmount =
      transaction.type === "REFUND" ? amount.negated() : amount;
    const existing = categoryTotals.get(key) ?? { name, value: ZERO };
    existing.value = existing.value.plus(signedAmount);
    categoryTotals.set(key, existing);
  }

  const sorted = [...categoryTotals.entries()]
    .map(([key, { name, value }]) => ({
      key,
      name,
      value: Decimal.max(value, ZERO),
    }))
    .filter((item) => item.value.greaterThan(0))
    .sort((left, right) => right.value.comparedTo(left.value));
  const total = sorted.reduce((sum, item) => sum.plus(item.value), ZERO);
  if (total.isZero()) return [];

  const visible = sorted.slice(0, maximumSlices);
  const remainder = sorted
    .slice(maximumSlices)
    .reduce((sum, item) => sum.plus(item.value), ZERO);
  if (remainder.greaterThan(0))
    visible.push({ key: "other", name: "Other", value: remainder });

  return visible.map((item) => ({
    key: item.key,
    name: item.name,
    value: moneyNumber(item.value),
    share: item.value.dividedBy(total).times(100).toDecimalPlaces(1).toNumber(),
  }));
}

export function calculateSpendingSplit(
  summary: FinancialSummary,
): SpendingSplitPoint[] {
  const total = Decimal.max(summary.netExpenses, ZERO);
  if (total.isZero()) return [];

  const essential = Decimal.min(
    total,
    Decimal.max(summary.essentialExpenses, ZERO),
  );
  const discretionary = Decimal.min(
    total.minus(essential),
    Decimal.max(summary.discretionaryExpenses, ZERO),
  );
  const unclassified = Decimal.max(
    total.minus(essential).minus(discretionary),
    ZERO,
  );
  const values = [
    { name: "Essential", value: essential, tone: "essential" as const },
    {
      name: "Discretionary",
      value: discretionary,
      tone: "discretionary" as const,
    },
    {
      name: "Unclassified",
      value: unclassified,
      tone: "unclassified" as const,
    },
  ];

  return values
    .filter((item) => item.value.greaterThan(0))
    .map((item) => ({
      ...item,
      value: moneyNumber(item.value),
      share: item.value
        .dividedBy(total)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber(),
    }));
}

export function monthlyEquivalent(
  amount: Decimal.Value,
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY",
): Decimal {
  const value = new Decimal(amount);
  switch (frequency) {
    case "WEEKLY":
      return value.times(52).dividedBy(12);
    case "QUARTERLY":
      return value.dividedBy(3);
    case "YEARLY":
      return value.dividedBy(12);
    case "MONTHLY":
      return value;
  }
}

export function calculateInsightHealthScore(input: {
  summary: FinancialSummary;
  budgetUtilization: Decimal | null;
  subscriptionMonthly: Decimal;
}) {
  const { summary } = input;
  const hasIncome = summary.income.greaterThan(0);
  const savingsRate = summary.savingsRate;
  const essentialRatio = hasIncome
    ? summary.essentialExpenses.dividedBy(summary.income)
    : null;
  const subscriptionRatio = hasIncome
    ? input.subscriptionMonthly.dividedBy(summary.income)
    : null;

  return calculateHealthScore([
    {
      key: "savings",
      earned: savingsRate
        ? boundedRatio(savingsRate.dividedBy(0.2)).times(25)
        : null,
      possible: 25,
      explanation: hasIncome
        ? "Based on cash surplus before investments against a 20% reference rate."
        : "Add cleared income to calculate savings behaviour.",
    },
    {
      key: "budget",
      earned: input.budgetUtilization
        ? boundedRatio(
            new Decimal(1.2).minus(input.budgetUtilization).dividedBy(0.4),
          ).times(20)
        : null,
      possible: 20,
      explanation: input.budgetUtilization
        ? "Rewards staying within the active monthly budget without treating unused budget as a target."
        : "Create a budget to include budget adherence.",
    },
    {
      key: "essential_spending",
      earned: essentialRatio
        ? boundedRatio(
            new Decimal(0.8).minus(essentialRatio).dividedBy(0.3),
          ).times(15)
        : null,
      possible: 15,
      explanation: essentialRatio
        ? "Compares essential expenses with cleared income; lower fixed pressure leaves more flexibility."
        : "Income and categorised expenses are needed for this component.",
    },
    {
      key: "recurring_costs",
      earned: subscriptionRatio
        ? boundedRatio(
            new Decimal(0.2).minus(subscriptionRatio).dividedBy(0.1),
          ).times(10)
        : null,
      possible: 10,
      explanation: subscriptionRatio
        ? "Compares active subscription monthly equivalents with cleared income."
        : "Income is needed to assess recurring-cost pressure.",
    },
  ]);
}

export function calculateSavingsOpportunities(input: {
  summary: FinancialSummary;
  categories: readonly CategorySpendingPoint[];
  nonEssentialSubscriptionMonthly: Decimal;
  budgetUtilization: Decimal | null;
}): SavingsOpportunity[] {
  const opportunities: SavingsOpportunity[] = [];
  const { summary } = input;

  if (summary.income.isZero()) {
    opportunities.push({
      key: "income_data",
      categoryKey: null,
      title: "Complete the income picture",
      explanation:
        "No cleared income is recorded for this financial month, so a reliable savings rate cannot be calculated yet.",
      action:
        "Add or clear this month’s income transactions before acting on savings estimates.",
      evidence: "Cleared monthly income is zero.",
      evidenceMetricKeys: ["income"],
      potentialMonthlyImpact: null,
      confidence: "high",
      tone: "neutral",
    });
  } else if (summary.cashRemainingAfterInvestments.isNegative()) {
    opportunities.push({
      key: "cash_flow_gap",
      categoryKey: null,
      title: "Close the monthly cash-flow gap",
      explanation:
        "Cleared expenses and investment contributions are currently higher than cleared income.",
      action:
        "Review flexible expenses first, then check whether this month’s investment contribution is affordable.",
      evidence: "Cash remaining after investments is below zero.",
      evidenceMetricKeys: [
        "income",
        "netExpenses",
        "investments",
        "cashRemainingAfterInvestments",
      ],
      potentialMonthlyImpact: moneyNumber(
        summary.cashRemainingAfterInvestments.abs(),
      ),
      confidence: "high",
      tone: "attention",
    });
  }

  if (summary.discretionaryExpenses.greaterThan(0)) {
    const scenario = summary.discretionaryExpenses.times(0.1);
    opportunities.push({
      key: "discretionary_ten_percent",
      categoryKey: null,
      title: "Test a 10% flexible-spending trim",
      explanation:
        "A small reduction in discretionary spending can improve cash remaining without cutting essentials.",
      action:
        "Choose one discretionary category for a one-month cap and review the result next month.",
      evidence: "Scenario uses 10% of this month’s discretionary expenses.",
      evidenceMetricKeys: ["discretionaryExpenses"],
      potentialMonthlyImpact: moneyNumber(scenario),
      confidence: "medium",
      tone: "attention",
    });
  }

  if (input.nonEssentialSubscriptionMonthly.greaterThan(0)) {
    opportunities.push({
      key: "subscription_review",
      categoryKey: "subscriptions",
      title: "Review non-essential subscriptions",
      explanation:
        "Active non-essential subscriptions create a recurring monthly commitment worth checking for current use.",
      action:
        "Review usage and renewal dates; pause or cancel only services that no longer provide value.",
      evidence:
        "Monthly equivalent of active subscriptions marked non-essential.",
      evidenceMetricKeys: ["subscriptionMonthlyEquivalent"],
      potentialMonthlyImpact: moneyNumber(
        input.nonEssentialSubscriptionMonthly,
      ),
      confidence: "high",
      tone: "neutral",
    });
  }

  const largestCategory = input.categories.find(
    (category) => category.name !== "Other",
  );
  if (largestCategory && largestCategory.share >= 35) {
    opportunities.push({
      key: "category_concentration",
      categoryKey: largestCategory.key,
      title: `Check ${largestCategory.name} concentration`,
      explanation: `${largestCategory.name} represents ${largestCategory.share}% of net category spending this month.`,
      action:
        "Inspect the underlying transactions and confirm this concentration is intentional and correctly categorised.",
      evidence: "Largest category share of current net expenses.",
      evidenceMetricKeys: ["netExpenses", "categorySpending"],
      potentialMonthlyImpact: null,
      confidence: "high",
      tone: "neutral",
    });
  }

  if (input.budgetUtilization?.greaterThan(0.8)) {
    opportunities.push({
      key: "budget_pressure",
      categoryKey: null,
      title: input.budgetUtilization.greaterThan(1)
        ? "Bring spending back within budget"
        : "Budget is entering the watch zone",
      explanation: `Current spending has used ${input.budgetUtilization.times(100).toDecimalPlaces(0).toString()}% of active budget capacity.`,
      action:
        "Pause lower-priority spending until the next financial month or revise the budget if the limit is no longer realistic.",
      evidence: "Net expenses divided by active budget amount.",
      evidenceMetricKeys: ["netExpenses", "budgetUtilization"],
      potentialMonthlyImpact: null,
      confidence: "high",
      tone: "attention",
    });
  }

  if (
    opportunities.length === 0 &&
    summary.cashRemainingAfterInvestments.greaterThanOrEqualTo(0)
  ) {
    opportunities.push({
      key: "protect_surplus",
      categoryKey: null,
      title: "Protect the current surplus",
      explanation:
        "Income currently covers consumption and investment contributions for this financial month.",
      action:
        "Decide how much of the remaining cash should stay liquid, support a goal, or remain as buffer.",
      evidence: "Cash remaining after investments is not negative.",
      evidenceMetricKeys: ["cashRemainingAfterInvestments"],
      potentialMonthlyImpact: null,
      confidence: "high",
      tone: "positive",
    });
  }

  return opportunities.slice(0, 4);
}

export function calculateSpendingForecast(input: {
  netExpenses: Decimal.Value;
  periodStart: Date;
  periodEnd: Date;
  instant: Date;
}): SpendingForecast | null {
  const expenses = new Decimal(input.netExpenses);
  if (expenses.isZero() || input.instant < input.periodStart) return null;

  const totalDuration = input.periodEnd.getTime() - input.periodStart.getTime();
  const elapsedDuration =
    Math.min(input.instant.getTime(), input.periodEnd.getTime()) -
    input.periodStart.getTime();
  const elapsedRatio = Math.min(
    1,
    Math.max(elapsedDuration / Math.max(totalDuration, 1), 0.03),
  );
  const projected = expenses.dividedBy(elapsedRatio);

  return {
    projectedExpensesLow: moneyNumber(projected.times(0.9)),
    projectedExpensesHigh: moneyNumber(projected.times(1.1)),
    elapsedPercent: new Decimal(elapsedRatio)
      .times(100)
      .toDecimalPlaces(0)
      .toNumber(),
    confidence: elapsedRatio >= 0.5 ? "medium" : "low",
  };
}
