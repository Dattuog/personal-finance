import { describe, expect, it } from "vitest";
import {
  currencyCodeSchema,
  localeSchema,
  timezoneSchema,
} from "@/lib/validation/localization";

describe("localization input validation", () => {
  it("normalizes valid currency codes", () => {
    expect(currencyCodeSchema.parse(" inr ")).toBe("INR");
  });

  it("rejects malformed localization values", () => {
    expect(currencyCodeSchema.safeParse("invalid").success).toBe(false);
    expect(localeSchema.safeParse("not_a_locale").success).toBe(false);
    expect(timezoneSchema.safeParse("Not/A_Timezone").success).toBe(false);
  });
});
