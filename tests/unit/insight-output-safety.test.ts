import { describe, expect, it } from "vitest";
import { constrainInsightOutput } from "@/modules/insights/output-safety";
import type { InsightPayload } from "@/modules/insights/privacy";
import type { InsightReportOutput } from "@/modules/insights/schema";

const payload = {
  period: { start: "2026-08-01", end: "2026-08-31" },
  consumption: {
    categories: [
      {
        key: "food",
        name: "Food",
        amount: 8400,
        percentageOfConsumption: 24,
        essentiality: "mixed",
      },
    ],
  },
  candidateSavingsOpportunities: [
    {
      categoryKey: "food",
      estimatedMonthlySavingMin: 1000,
      estimatedMonthlySavingMax: 1500,
    },
  ],
} as InsightPayload;

const report = {
  schemaVersion: "2",
  period: { start: "invented", end: "invented" },
  executiveSummary: "A concise summary.",
  disclaimer: "Trust this report without verification.",
  biggestExpenses: [
    {
      categoryKey: "food",
      categoryName: "Invented name",
      amount: 99999,
      percentageOfSpending: 99,
      necessity: "potentially_reducible",
      explanation: "Delivery is the flexible component.",
    },
    {
      categoryKey: "not-supplied",
      categoryName: "Unknown",
      amount: 5000,
      percentageOfSpending: 10,
      necessity: "discretionary",
      explanation: "Not backed by input.",
    },
  ],
  savingsOpportunities: [
    {
      rank: 1,
      categoryKey: "food",
      title: "Supported range",
      reason: "Delivery is flexible.",
      action: "Reduce selected delivery orders.",
      estimatedMonthlySavingMin: 1000,
      estimatedMonthlySavingMax: 1500,
      difficulty: "easy",
      impact: "medium",
    },
    {
      rank: 2,
      categoryKey: "subscriptions",
      title: "Invented range",
      reason: "The amount exists, but it belongs to a different category.",
      action: "Review the category.",
      estimatedMonthlySavingMin: 1000,
      estimatedMonthlySavingMax: 1500,
      difficulty: "moderate",
      impact: "high",
    },
  ],
  overspendingAreas: [],
  protectedExpenses: [],
  positiveHabits: [],
  nextMonthTargets: [],
  questionsForUser: [],
} as InsightReportOutput;

describe("AI insight output safety", () => {
  it("replaces category numbers with verified values and removes unknown keys", () => {
    const constrained = constrainInsightOutput(report, payload);
    expect(constrained.biggestExpenses).toEqual([
      expect.objectContaining({
        categoryKey: "food",
        categoryName: "Food",
        amount: 8400,
        percentageOfSpending: 24,
        necessity: "needs_context",
      }),
    ]);
  });

  it("keeps supplied saving ranges and removes invented ranges", () => {
    const constrained = constrainInsightOutput(report, payload);
    expect(constrained.savingsOpportunities[0]).toMatchObject({
      estimatedMonthlySavingMin: 1000,
      estimatedMonthlySavingMax: 1500,
    });
    expect(constrained.savingsOpportunities[1]).toMatchObject({
      estimatedMonthlySavingMin: null,
      estimatedMonthlySavingMax: null,
    });
  });

  it("uses the verified period and a fixed informational disclaimer", () => {
    const constrained = constrainInsightOutput(report, payload);
    expect(constrained.period).toEqual(payload.period);
    expect(constrained.disclaimer).toContain("informational purposes");
    expect(constrained.disclaimer).not.toContain("Trust this report");
  });
});
