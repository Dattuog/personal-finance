import "dotenv/config";

import assert from "node:assert/strict";
import { calculateFinancialSummary } from "@/modules/analytics/calculate-summary";
import {
  AIProviderError,
  safeAIProviderMessage,
} from "@/modules/insights/errors";
import {
  buildPrivacyFilteredInsightPayload,
  type InsightPayload,
  type SafeInsightSubscription,
  type SafeInsightTransaction,
  type SafeSavingsCandidate,
} from "@/modules/insights/privacy";
import { createFinanceAIProvider } from "@/modules/insights/provider-factory";
import type { InsightReportOutput } from "@/modules/insights/schema";

const instant = new Date("2026-08-10T00:00:00.000Z");

function summaryFrom(transactions: readonly SafeInsightTransaction[]) {
  return calculateFinancialSummary(
    transactions.map((transaction, index) => ({
      id: `synthetic-${index}`,
      type: transaction.type,
      amount: transaction.amount,
      date: instant,
      categorySlug: transaction.categoryKey,
      necessity:
        transaction.essentiality === "essential" ||
        transaction.essentiality === "mostly_essential"
          ? ("ESSENTIAL" as const)
          : transaction.essentiality === "discretionary"
            ? ("DISCRETIONARY" as const)
            : ("NEUTRAL" as const),
      costBehaviour:
        transaction.categoryKey === "rent"
          ? ("FIXED" as const)
          : ("VARIABLE" as const),
    })),
  );
}

function payloadFor(input: {
  current: readonly SafeInsightTransaction[];
  previous?: readonly SafeInsightTransaction[];
  subscriptions?: readonly SafeInsightSubscription[];
  opportunities?: readonly SafeSavingsCandidate[];
}): InsightPayload {
  const previous = input.previous ?? [];
  return buildPrivacyFilteredInsightPayload({
    period: {
      start: new Date("2026-08-01T00:00:00.000Z"),
      end: new Date("2026-08-31T23:59:59.999Z"),
      month: "August",
      year: 2026,
    },
    currencyCode: "INR",
    summary: summaryFrom(input.current),
    previousSummary: summaryFrom(previous),
    hasPreviousMonthData: previous.length > 0,
    currentTransactions: input.current,
    previousTransactions: previous,
    subscriptions: input.subscriptions ?? [],
    budgets: [],
    opportunities: input.opportunities ?? [],
  });
}

const commonIncome = (amount: number): SafeInsightTransaction => ({
  type: "INCOME",
  amount,
  categoryKey: "salary",
  categoryName: "Salary",
});

const profiles: {
  name: string;
  payload: InsightPayload;
  validate: (report: InsightReportOutput) => void;
}[] = [
  {
    name: "high food delivery",
    payload: payloadFor({
      current: [
        commonIncome(60000),
        {
          type: "EXPENSE",
          amount: 15000,
          categoryKey: "rent",
          categoryName: "Rent",
          essentiality: "essential",
        },
        {
          type: "EXPENSE",
          amount: 3500,
          categoryKey: "groceries",
          categoryName: "Groceries",
          essentiality: "mostly_essential",
        },
        {
          type: "EXPENSE",
          amount: 2000,
          categoryKey: "restaurants",
          categoryName: "Restaurants",
          essentiality: "discretionary",
        },
        {
          type: "EXPENSE",
          amount: 4500,
          categoryKey: "food-delivery",
          categoryName: "Food delivery",
          essentiality: "discretionary",
        },
        {
          type: "EXPENSE",
          amount: 3000,
          categoryKey: "transport",
          categoryName: "Transport",
          essentiality: "unknown",
        },
        {
          type: "EXPENSE",
          amount: 2500,
          categoryKey: "subscriptions",
          categoryName: "Subscriptions",
          essentiality: "unknown",
        },
        {
          type: "EXPENSE",
          amount: 5000,
          categoryKey: "family-support",
          categoryName: "Family support",
          essentiality: "essential",
        },
        {
          type: "INVESTMENT",
          amount: 8000,
          categoryKey: "mutual-funds",
          categoryName: "Mutual Fund SIP",
        },
      ],
      opportunities: [
        {
          key: "food_delivery_review",
          categoryKey: "food",
          title: "Review food delivery frequency",
          reason: "Delivery is the largest discretionary food component.",
          action: "Replace selected delivery orders with planned meals.",
          evidenceMetricKeys: ["consumption.categories.food.subcategories"],
          estimatedMonthlySavingMin: 1000,
          estimatedMonthlySavingMax: 1500,
          confidence: "medium",
          limitation: "This is a scenario, not a guaranteed saving.",
        },
      ],
    }),
    validate: (report) => {
      assert(
        report.biggestExpenses.some((item) => item.categoryKey === "rent"),
      );
      assert(
        report.biggestExpenses.some((item) => item.categoryKey === "food"),
      );
      assert(
        report.protectedExpenses.some((item) => item.categoryKey === "rent"),
      );
      assert(
        report.savingsOpportunities.some(
          (item) => item.categoryKey === "food" && item.action.length > 10,
        ),
      );
      assert.match(JSON.stringify(report), /delivery/i);
      assert.doesNotMatch(report.savingsOpportunities[0]?.title ?? "", /rent/i);
    },
  },
  {
    name: "efficient user",
    payload: payloadFor({
      current: [
        commonIncome(80000),
        {
          type: "EXPENSE",
          amount: 18000,
          categoryKey: "rent",
          categoryName: "Rent",
          essentiality: "essential",
        },
        {
          type: "EXPENSE",
          amount: 7000,
          categoryKey: "groceries",
          categoryName: "Groceries",
          essentiality: "mostly_essential",
        },
        {
          type: "EXPENSE",
          amount: 3000,
          categoryKey: "electricity",
          categoryName: "Utilities",
          essentiality: "essential",
        },
        {
          type: "EXPENSE",
          amount: 4000,
          categoryKey: "transport",
          categoryName: "Transport",
          essentiality: "unknown",
        },
        {
          type: "EXPENSE",
          amount: 1000,
          categoryKey: "subscriptions",
          categoryName: "Subscriptions",
          essentiality: "unknown",
        },
        {
          type: "INVESTMENT",
          amount: 20000,
          categoryKey: "mutual-funds",
          categoryName: "Mutual Fund SIP",
        },
      ],
    }),
    validate: (report) => {
      assert(report.positiveHabits.length > 0);
      assert(report.overspendingAreas.length <= 1);
      assert.doesNotMatch(JSON.stringify(report), /financial crisis/i);
    },
  },
  {
    name: "subscription heavy",
    payload: (() => {
      const subscriptions: SafeInsightSubscription[] = [
        ["ChatGPT", 2000],
        ["Claude", 2000],
        ["Gemini", 2000],
        ["Netflix", 649],
        ["Spotify", 119],
        ["Other SaaS", 1500],
      ].map(([name, monthlyAmount]) => ({
        name: String(name),
        monthlyAmount: Number(monthlyAmount),
        billingFrequency: "MONTHLY",
        usageStatus: "unknown",
        essentiality: "unknown",
      }));
      return payloadFor({
        current: [
          commonIncome(50000),
          {
            type: "EXPENSE",
            amount: 8268,
            categoryKey: "subscriptions",
            categoryName: "Subscriptions",
            essentiality: "unknown",
          },
        ],
        subscriptions,
        opportunities: [
          {
            key: "subscription_review",
            categoryKey: "subscriptions",
            title: "Review recurring services",
            reason: "Subscriptions are a meaningful recurring cost.",
            action: "Review usage before changing any service.",
            evidenceMetricKeys: ["subscriptions"],
            estimatedMonthlySavingMin: null,
            estimatedMonthlySavingMax: null,
            confidence: "high",
            limitation: "Usage is unknown, so overlap is not established.",
          },
        ],
      });
    })(),
    validate: (report) => {
      assert(
        report.overspendingAreas.some(
          (item) => item.categoryKey === "subscriptions",
        ) ||
          report.savingsOpportunities.some(
            (item) => item.categoryKey === "subscriptions",
          ),
      );
      const text = JSON.stringify(report).toLocaleLowerCase();
      assert(!text.includes("are redundant"));
      assert(!text.includes("all redundant"));
    },
  },
];

console.warn(
  "Privacy reminder: this verification sends three built-in synthetic profiles to Gemini and never reads user finance records.",
);

try {
  const provider = createFinanceAIProvider();
  for (const profile of profiles) {
    const result = await provider.generateFinancialInsight(profile.payload);
    profile.validate(result.insight);
    console.log(`Passed Gemini profile: ${profile.name}.`);
  }
} catch (error) {
  const message =
    error instanceof AIProviderError
      ? safeAIProviderMessage(error)
      : error instanceof Error
        ? error.message
        : "Unknown verification failure.";
  console.error(`Gemini profile verification failed: ${message}`);
  process.exitCode = 1;
}
