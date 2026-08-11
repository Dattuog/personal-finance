import { describe, expect, it } from "vitest";
import {
  createImportFingerprint,
  escapeCsvFormula,
} from "@/modules/imports/fingerprint";

describe("CSV safety and duplicate detection", () => {
  it("canonicalizes descriptions for stable fingerprints", () => {
    const base = {
      userId: "u1",
      accountId: "a1",
      date: "2026-08-01",
      amount: "1,200.00",
      description: "  Demo   Merchant ",
      transactionType: "expense",
    };
    const normalized = {
      ...base,
      amount: "1200.00",
      description: "demo merchant",
      transactionType: "EXPENSE",
    };
    expect(createImportFingerprint(base)).toBe(
      createImportFingerprint(normalized),
    );
  });

  it("neutralizes spreadsheet formulas on export", () => {
    expect(escapeCsvFormula("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvFormula("Safe text")).toBe("Safe text");
  });
});
