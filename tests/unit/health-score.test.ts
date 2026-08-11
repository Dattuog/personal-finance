import { describe, expect, it } from "vitest";
import { calculateHealthScore } from "@/modules/analytics/health-score";

describe("financial health score", () => {
  it("normalizes only available components", () => {
    const result = calculateHealthScore([
      { key: "savings", earned: 20, possible: 25, explanation: "On target" },
      { key: "budget", earned: 10, possible: 20, explanation: "Near limit" },
      { key: "debt", earned: null, possible: 10, explanation: "No debt data" },
    ]);
    expect(result.score).toBe(67);
    expect(result.label).toBe("good");
  });

  it("does not punish a user when all data is missing", () => {
    expect(
      calculateHealthScore([
        {
          key: "savings",
          earned: null,
          possible: 25,
          explanation: "No income history",
        },
      ]).label,
    ).toBe("insufficient_data");
  });
});
