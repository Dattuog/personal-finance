import { describe, expect, it } from "vitest";
import {
  calculateGoalContribution,
  emergencyFundMonths,
} from "@/modules/goals/calculations";
import { monthlyEquivalent } from "@/modules/subscriptions/calculations";

describe("planning calculations", () => {
  it("normalizes subscription periods to a monthly equivalent", () => {
    expect(monthlyEquivalent("1200", "YEARLY").toFixed(2)).toBe("100.00");
    expect(monthlyEquivalent("300", "QUARTERLY").toFixed(2)).toBe("100.00");
    expect(monthlyEquivalent("100", "WEEKLY").toFixed(2)).toBe("433.33");
  });

  it("calculates the required goal contribution", () => {
    const result = calculateGoalContribution({
      targetAmount: "120000",
      currentAmount: "24000",
      asOf: new Date("2026-08-05T00:00:00Z"),
      targetDate: new Date("2027-08-05T00:00:00Z"),
    });
    expect(result.monthsRemaining).toBe(12);
    expect(result.requiredMonthlyContribution?.toFixed(2)).toBe("8000.00");
  });

  it("explains a past-due goal instead of returning an impossible amount", () => {
    const result = calculateGoalContribution({
      targetAmount: "100",
      currentAmount: "20",
      asOf: new Date("2026-08-05T00:00:00Z"),
      targetDate: new Date("2026-08-01T00:00:00Z"),
    });
    expect(result.isPastDue).toBe(true);
    expect(result.requiredMonthlyContribution).toBeNull();
  });

  it("handles emergency coverage without essential-spending data", () => {
    expect(emergencyFundMonths("120000", "30000")?.toString()).toBe("4");
    expect(emergencyFundMonths("120000", "0")).toBeNull();
  });
});
