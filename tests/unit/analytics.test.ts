import { describe, expect, it } from "vitest";
import {
  calculateBudgetUtilization,
  calculateFinancialSummary,
} from "@/modules/analytics/calculate-summary";
import type { AnalyticsTransaction } from "@/modules/analytics/types";

const date = new Date("2026-08-01T00:00:00.000Z");
const tx = (
  overrides: Partial<AnalyticsTransaction> &
    Pick<AnalyticsTransaction, "id" | "type" | "amount">,
): AnalyticsTransaction => ({ date, ...overrides });

describe("financial counting rules", () => {
  it("separates transfers and investments from consumption", () => {
    const summary = calculateFinancialSummary([
      tx({ id: "income", type: "INCOME", amount: "80000" }),
      tx({
        id: "rent",
        type: "EXPENSE",
        amount: "18000",
        necessity: "ESSENTIAL",
        costBehaviour: "FIXED",
      }),
      tx({ id: "card-payment", type: "TRANSFER", amount: "9000" }),
      tx({ id: "sip", type: "INVESTMENT", amount: "8000" }),
    ]);
    expect(summary.income.toFixed(2)).toBe("80000.00");
    expect(summary.netExpenses.toFixed(2)).toBe("18000.00");
    expect(summary.transfers.toFixed(2)).toBe("9000.00");
    expect(summary.investments.toFixed(2)).toBe("8000.00");
    expect(summary.cashRemainingAfterInvestments.toFixed(2)).toBe("54000.00");
  });

  it("reduces spending and its classification when a refund exists", () => {
    const summary = calculateFinancialSummary([
      tx({
        id: "purchase",
        type: "EXPENSE",
        amount: "2500",
        necessity: "DISCRETIONARY",
        costBehaviour: "VARIABLE",
      }),
      tx({
        id: "refund",
        type: "REFUND",
        amount: "500",
        necessity: "DISCRETIONARY",
        costBehaviour: "VARIABLE",
      }),
    ]);
    expect(summary.expenses.toFixed(2)).toBe("2500.00");
    expect(summary.refunds.toFixed(2)).toBe("500.00");
    expect(summary.netExpenses.toFixed(2)).toBe("2000.00");
    expect(summary.discretionaryExpenses.toFixed(2)).toBe("2000.00");
  });

  it("ignores pending and soft-deleted records", () => {
    const summary = calculateFinancialSummary([
      tx({ id: "pending", type: "EXPENSE", amount: "500", status: "PENDING" }),
      tx({ id: "deleted", type: "EXPENSE", amount: "500", deletedAt: date }),
    ]);
    expect(summary.expenses.isZero()).toBe(true);
  });

  it("handles zero income rates and budget utilization safely", () => {
    const summary = calculateFinancialSummary([
      tx({ id: "expense", type: "EXPENSE", amount: "100" }),
    ]);
    expect(summary.savingsRate).toBeNull();
    expect(summary.investmentRate).toBeNull();
    expect(calculateBudgetUtilization("450", "1000")?.toString()).toBe("0.45");
    expect(calculateBudgetUtilization("450", "0")).toBeNull();
  });
});
