import { describe, expect, it } from "vitest";
import { getMonthRange } from "@/lib/dates/month-boundary";

describe("financial month boundaries", () => {
  it("uses the user timezone for India month boundaries", () => {
    const range = getMonthRange(
      new Date("2026-08-05T12:00:00Z"),
      "Asia/Kolkata",
    );
    expect(range.start.toISOString()).toBe("2026-07-31T18:30:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-31T18:29:59.999Z");
  });

  it("handles leap-year February in a daylight-saving timezone", () => {
    const range = getMonthRange(
      new Date("2024-02-15T12:00:00Z"),
      "America/New_York",
    );
    expect(range.start.toISOString()).toBe("2024-02-01T05:00:00.000Z");
    expect(range.end.toISOString()).toBe("2024-03-01T04:59:59.999Z");
  });

  it("supports a custom financial month start", () => {
    const range = getMonthRange(
      new Date("2026-08-03T12:00:00Z"),
      "Asia/Kolkata",
      5,
    );
    expect(range.start.toISOString()).toBe("2026-07-04T18:30:00.000Z");
  });
});
