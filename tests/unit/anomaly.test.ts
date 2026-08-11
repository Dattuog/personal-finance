import { describe, expect, it } from "vitest";
import { detectAmountAnomaly } from "@/modules/analytics/anomaly";

describe("robust anomaly detection", () => {
  it("requires enough category history", () => {
    expect(
      detectAmountAnomaly({ amount: "900", historicalAmounts: ["100", "110"] })
        .reasonCode,
    ).toBe("INSUFFICIENT_HISTORY");
  });

  it("detects a value above the median absolute-deviation baseline", () => {
    const result = detectAmountAnomaly({
      amount: "500",
      historicalAmounts: ["100", "105", "98", "110", "101", "99", "103"],
    });
    expect(result.isAnomaly).toBe(true);
    expect(result.reasonCode).toBe("ABOVE_CATEGORY_BASELINE");
  });

  it("does not flag a known recurring payment", () => {
    const result = detectAmountAnomaly({
      amount: "18000",
      historicalAmounts: ["18000", "18000", "18000", "18000", "18000", "18000"],
      isKnownRecurring: true,
    });
    expect(result.isAnomaly).toBe(false);
    expect(result.reasonCode).toBe("KNOWN_RECURRING");
  });
});
