import { describe, expect, it } from "vitest";
import {
  parseMoneyInput,
  parseSignedMoneyInput,
  ratioOrNull,
  serializeMoney,
  sumMoney,
} from "@/lib/money/decimal";

describe("decimal money", () => {
  it("parses INR-formatted strings without binary floating point", () => {
    expect(serializeMoney(parseMoneyInput("1,23,456.70"))).toBe("123456.70");
    expect(serializeMoney(sumMoney(["0.1", "0.2"]))).toBe("0.30");
  });

  it("rejects zero, negative, and excess precision", () => {
    expect(() => parseMoneyInput("0")).toThrow();
    expect(() => parseMoneyInput("-10")).toThrow();
    expect(() => parseMoneyInput("10.999")).toThrow();
    expect(() => parseMoneyInput("10000000000000000")).toThrow(
      "Amount is too large",
    );
  });

  it("accepts bounded signed opening balances", () => {
    expect(serializeMoney(parseSignedMoneyInput("-1250.50"))).toBe("-1250.50");
    expect(() => parseSignedMoneyInput("-10000000000000000")).toThrow(
      "Amount is too large",
    );
  });

  it("returns null for division by zero", () => {
    expect(ratioOrNull("10", "0")).toBeNull();
  });
});
