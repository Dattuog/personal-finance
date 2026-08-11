import { describe, expect, it } from "vitest";
import { calculateFinancialSummary } from "@/modules/analytics/calculate-summary";
import {
  buildPrivacyFilteredInsightPayload,
  type SafeInsightSubscription,
  type SafeInsightTransaction,
  type SafeSavingsCandidate,
} from "@/modules/insights/privacy";
import { monthlyInsightSystemPrompt } from "@/prompts/monthly-insight.v3";

const date = new Date("2026-08-10T00:00:00.000Z");

function summaryFrom(transactions: readonly SafeInsightTransaction[]) {
  return calculateFinancialSummary(
    transactions.map((transaction, index) => ({
      id: `synthetic-${index}`,
      type: transaction.type,
      amount: transaction.amount,
      date,
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
}) {
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

describe("specific Gemini insight profiles", () => {
  it("provides a high-food profile with delivery separated from groceries", () => {
    const current: SafeInsightTransaction[] = [
      {
        type: "INCOME",
        amount: 60000,
        categoryKey: "salary",
        categoryName: "Salary",
      },
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
    ];
    const foodCandidate: SafeSavingsCandidate = {
      key: "food_delivery_review",
      categoryKey: "food",
      title: "Review delivery frequency",
      reason: "Food delivery is the largest discretionary food component.",
      action: "Replace selected delivery orders with planned meals.",
      evidenceMetricKeys: ["consumption.categories.food.subcategories"],
      estimatedMonthlySavingMin: 1000,
      estimatedMonthlySavingMax: 1500,
      confidence: "medium",
      limitation: "A scenario, not a guaranteed saving.",
    };
    const payload = payloadFor({ current, opportunities: [foodCandidate] });

    expect(payload.consumption.categories[0]).toMatchObject({
      key: "rent",
      amount: 15000,
      essentiality: "essential",
    });
    const food = payload.consumption.categories.find(
      (category) => category.key === "food",
    );
    expect(food).toMatchObject({ amount: 10000, essentiality: "mixed" });
    expect(food?.subcategories).toEqual([
      { key: "food-delivery", name: "Food delivery", amount: 4500 },
      { key: "groceries", name: "Groceries", amount: 3500 },
      { key: "restaurants", name: "Restaurants", amount: 2000 },
    ]);
    expect(payload.familySupport.amount).toBe(5000);
    expect(
      payload.consumption.categories.some(
        (category) => category.key === "family-support",
      ),
    ).toBe(false);
    expect(payload.investments).toMatchObject({ total: 8000 });
    expect(payload.candidateSavingsOpportunities[0]).toEqual(foodCandidate);
  });

  it("gives an efficient profile positive evidence without fabricating problems", () => {
    const current: SafeInsightTransaction[] = [
      {
        type: "INCOME",
        amount: 80000,
        categoryKey: "salary",
        categoryName: "Salary",
      },
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
    ];
    const payload = payloadFor({ current });

    expect(payload.savings.leftoverCashAfterInvesting).toBe(27000);
    expect(payload.investments).toMatchObject({ total: 20000, rate: 25 });
    expect(payload.unusualChanges).toEqual([]);
    expect(payload.candidateSavingsOpportunities).toEqual([]);
  });

  it("exposes subscription pressure without asserting service overlap", () => {
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
    const total = subscriptions.reduce(
      (sum, subscription) => sum + Number(subscription.monthlyAmount),
      0,
    );
    const current: SafeInsightTransaction[] = [
      {
        type: "INCOME",
        amount: 50000,
        categoryKey: "salary",
        categoryName: "Salary",
      },
      {
        type: "EXPENSE",
        amount: total,
        categoryKey: "subscriptions",
        categoryName: "Subscriptions",
        essentiality: "unknown",
      },
    ];
    const payload = payloadFor({
      current,
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

    expect(payload.subscriptions).toHaveLength(6);
    expect(
      payload.subscriptions.every((item) => item.usageStatus === "unknown"),
    ).toBe(true);
    expect(payload.consumption.categories[0]).toMatchObject({
      key: "subscriptions",
      amount: 8268,
      essentiality: "unknown",
    });
    expect(JSON.stringify(payload)).not.toContain("overlapDetected");
  });

  it("explicitly rejects generic, unsupported advice in the prompt", () => {
    expect(monthlyInsightSystemPrompt).toContain("Never give generic advice");
    expect(monthlyInsightSystemPrompt).toContain(
      "Do not invent savings amounts",
    );
    expect(monthlyInsightSystemPrompt).toContain(
      "It is valid to return an empty list for an efficient user",
    );
    expect(monthlyInsightSystemPrompt).toContain(
      "Never claim services overlap merely because their names",
    );
  });
});
