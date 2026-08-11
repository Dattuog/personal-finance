import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { calculateFinancialSummary } from "@/modules/analytics/calculate-summary";
import {
  calculateCategorySpending,
  calculateSavingsOpportunities,
  calculateSpendingForecast,
  calculateSpendingSplit,
  monthlyEquivalent,
} from "@/modules/insights/dashboard-analytics";

const date = new Date("2026-08-06T00:00:00.000Z");

describe("insights dashboard analytics", () => {
  it("builds category spending from cleared expenses and refunds", () => {
    const result = calculateCategorySpending([
      {
        type: "EXPENSE",
        amount: "5000",
        status: "CLEARED",
        categoryName: "Food",
      },
      {
        type: "REFUND",
        amount: "1000",
        status: "CLEARED",
        categoryName: "Food",
      },
      {
        type: "EXPENSE",
        amount: "9000",
        status: "PENDING",
        categoryName: "Travel",
      },
    ]);

    expect(result).toEqual([
      { key: "uncategorised", name: "Food", value: 4000, share: 100 },
    ]);
  });

  it("keeps essential, discretionary, and unclassified spending visible", () => {
    const summary = calculateFinancialSummary([
      {
        id: "income",
        type: "INCOME",
        amount: "50000",
        date,
      },
      {
        id: "rent",
        type: "EXPENSE",
        amount: "15000",
        date,
        necessity: "ESSENTIAL",
      },
      {
        id: "dining",
        type: "EXPENSE",
        amount: "5000",
        date,
        necessity: "DISCRETIONARY",
      },
      { id: "other", type: "EXPENSE", amount: "2000", date },
    ]);

    expect(calculateSpendingSplit(summary)).toEqual([
      { name: "Essential", value: 15000, share: 68.2, tone: "essential" },
      {
        name: "Discretionary",
        value: 5000,
        share: 22.7,
        tone: "discretionary",
      },
      {
        name: "Unclassified",
        value: 2000,
        share: 9.1,
        tone: "unclassified",
      },
    ]);
  });

  it("creates evidence-backed saving scenarios without altering essentials", () => {
    const summary = calculateFinancialSummary([
      { id: "income", type: "INCOME", amount: "40000", date },
      {
        id: "flexible",
        type: "EXPENSE",
        amount: "10000",
        date,
        necessity: "DISCRETIONARY",
      },
    ]);
    const result = calculateSavingsOpportunities({
      summary,
      categories: [{ key: "dining", name: "Dining", value: 10000, share: 100 }],
      nonEssentialSubscriptionMonthly: new Decimal(0),
      budgetUtilization: null,
    });

    expect(result[0]?.key).toBe("discretionary_ten_percent");
    expect(result[0]?.potentialMonthlyImpact).toBe(1000);
    expect(result[0]?.evidenceMetricKeys).toContain("discretionaryExpenses");
  });

  it("normalizes recurring costs and returns an explicit forecast range", () => {
    expect(monthlyEquivalent("1200", "YEARLY").toString()).toBe("100");
    expect(monthlyEquivalent("300", "WEEKLY").toString()).toBe("1300");

    const forecast = calculateSpendingForecast({
      netExpenses: "10000",
      periodStart: new Date("2026-08-01T00:00:00.000Z"),
      periodEnd: new Date("2026-08-31T23:59:59.999Z"),
      instant: new Date("2026-08-16T12:00:00.000Z"),
    });
    expect(forecast?.projectedExpensesLow).toBeLessThan(
      forecast?.projectedExpensesHigh ?? 0,
    );
    expect(forecast?.confidence).toBe("medium");
  });
});
