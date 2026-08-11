import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  AIProviderError,
  safeAIProviderMessage,
} from "@/modules/insights/errors";
import {
  GeminiFinanceProvider,
  mapGeminiError,
  type GeminiInteractionRequest,
} from "@/modules/insights/providers/gemini-provider";
import type { InsightPayload } from "@/modules/insights/privacy";
import type { InsightReportOutput } from "@/modules/insights/schema";

const apiKey = "synthetic-test-api-key";
const model = "gemini-3.5-flash-lite";
const payload: InsightPayload = {
  schemaVersion: "2",
  period: {
    start: "2026-08-01T00:00:00.000Z",
    end: "2026-08-31T23:59:59.999Z",
    month: "August",
    year: 2026,
  },
  currency: "INR",
  income: {
    total: 60000,
    sources: [{ name: "Salary", amount: 60000 }],
  },
  consumption: {
    total: 31500,
    categories: [
      {
        key: "rent",
        name: "Rent",
        amount: 15000,
        percentageOfConsumption: 47.6,
        previousMonthAmount: 15000,
        changeAmount: 0,
        changePercentage: 0,
        essentiality: "essential",
        subcategories: [],
      },
    ],
  },
  subscriptions: [],
  familySupport: { amount: 0 },
  investments: {
    total: 8000,
    rate: 13.3,
    items: [{ type: "Mutual Fund SIP", amount: 8000 }],
  },
  savings: {
    amount: 28500,
    rate: 47.5,
    leftoverCashAfterInvesting: 20500,
  },
  transfers: { total: 10000 },
  previousMonth: {
    income: 60000,
    consumption: 31500,
    investments: 8000,
    savings: 28500,
    savingsRate: 47.5,
  },
  budgetStatus: [],
  unusualChanges: [],
  candidateSavingsOpportunities: [],
  healthScore: 76,
};
const validInsight: InsightReportOutput = {
  schemaVersion: "2",
  period: { start: payload.period.start, end: payload.period.end },
  executiveSummary: "Income covers recorded spending and investing.",
  biggestExpenses: [
    {
      categoryKey: "rent",
      categoryName: "Rent",
      amount: 15000,
      percentageOfSpending: 47.6,
      necessity: "essential",
      explanation: "Rent is the largest verified category and is fixed.",
    },
  ],
  overspendingAreas: [],
  savingsOpportunities: [],
  protectedExpenses: [
    {
      categoryKey: "rent",
      reason: "Rent appears essential and should not be the first cut.",
    },
  ],
  positiveHabits: ["Recorded income covers consumption."],
  nextMonthTargets: [],
  questionsForUser: [],
  disclaimer: "Informational only.",
};

const providerWith = (
  requestInteraction: (request: GeminiInteractionRequest) => Promise<{
    output_text?: string | undefined;
    usage?:
      | {
          total_input_tokens?: number | undefined;
          total_output_tokens?: number | undefined;
          total_thought_tokens?: number | undefined;
          total_tokens?: number | undefined;
        }
      | undefined;
  }>,
  maxAttempts = 1,
) =>
  new GeminiFinanceProvider(
    { apiKey, model, maxOutputTokens: 1500 },
    {
      requestInteraction,
      maxAttempts,
      sleep: vi.fn(async () => {}),
      random: () => 0,
    },
  );

describe("GeminiFinanceProvider", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses a stateless structured request and maps validated output and usage", async () => {
    const requestInteraction = vi.fn(
      async (request: GeminiInteractionRequest) => {
        void request;
        return {
          output_text: JSON.stringify(validInsight),
          usage: {
            total_input_tokens: 900,
            total_output_tokens: 450,
            total_thought_tokens: 0,
            total_tokens: 1350,
          },
        };
      },
    );

    const result =
      await providerWith(requestInteraction).generateFinancialInsight(payload);
    const request = requestInteraction.mock.calls[0]?.[0];

    expect(request).toMatchObject({
      model,
      stream: false,
      store: false,
      generation_config: { max_output_tokens: 1500 },
      response_format: {
        type: "text",
        mime_type: "application/json",
      },
    });
    expect(request?.response_format.schema).toMatchObject({ type: "object" });
    expect(request?.system_instruction).toContain(
      "VERIFIED financial statistics",
    );
    expect(request?.input).not.toContain(apiKey);
    expect(request?.input).not.toContain("email");
    expect(JSON.parse(request?.input ?? "{}")).toEqual({
      task: "Generate a personal-finance insight report.",
      analytics: payload,
    });
    expect(result.insight).toEqual(validInsight);
    expect(result.usage).toEqual({
      provider: "gemini",
      model,
      inputTokens: 900,
      outputTokens: 450,
      thoughtTokens: 0,
      totalTokens: 1350,
    });
  });

  it.each([
    ["", "EMPTY_AI_RESPONSE"],
    ["This is not JSON.", "INVALID_AI_JSON"],
    [
      JSON.stringify({ executiveSummary: "Missing fields" }),
      "INVALID_AI_SCHEMA",
    ],
  ])("rejects unusable output with %s", async (outputText, expectedCode) => {
    const requestInteraction = vi.fn(async () => ({
      output_text: outputText,
    }));
    const provider = providerWith(requestInteraction, 3);

    await expect(
      provider.generateFinancialInsight(payload),
    ).rejects.toMatchObject({
      code: expectedCode,
    });
    expect(requestInteraction).toHaveBeenCalledTimes(1);
  });

  it("maps rate limits and retries only transient failures", async () => {
    const requestInteraction = vi
      .fn<
        (request: GeminiInteractionRequest) => Promise<{ output_text?: string }>
      >()
      .mockRejectedValueOnce(
        Object.assign(new Error("RESOURCE_EXHAUSTED"), { status: 429 }),
      )
      .mockResolvedValueOnce({ output_text: JSON.stringify(validInsight) });

    const result = await providerWith(
      requestInteraction,
      2,
    ).generateFinancialInsight(payload);

    expect(requestInteraction).toHaveBeenCalledTimes(2);
    expect(result.insight.executiveSummary).toBe(validInsight.executiveSummary);
    expect(
      mapGeminiError(
        Object.assign(new Error("RESOURCE_EXHAUSTED"), { status: 429 }),
      ).code,
    ).toBe("RATE_LIMITED");
    expect(
      safeAIProviderMessage(
        mapGeminiError(
          Object.assign(new Error(`RESOURCE_EXHAUSTED ${apiKey}`), {
            status: 429,
          }),
        ),
      ),
    ).not.toContain(apiKey);
  });

  it.each([
    [401, "AUTHENTICATION_FAILED"],
    [403, "AUTHENTICATION_FAILED"],
    [404, "MODEL_NOT_AVAILABLE"],
    [503, "PROVIDER_UNAVAILABLE"],
  ])("maps provider HTTP %s safely", (status, expectedCode) => {
    const mapped = mapGeminiError(
      Object.assign(new Error("provider request failed"), { status }),
    );
    expect(mapped.code).toBe(expectedCode);
    expect(mapped.message).not.toContain(apiKey);
  });

  it("fails AI initialization clearly when the API key is missing", () => {
    expect(
      () =>
        new GeminiFinanceProvider({
          apiKey: "",
          model,
          maxOutputTokens: 1500,
        }),
    ).toThrowError(
      expect.objectContaining<Partial<AIProviderError>>({
        code: "MISSING_CONFIGURATION",
      }),
    );
  });

  it("returns browser-safe degradation messages without secrets", () => {
    const message = safeAIProviderMessage(
      new AIProviderError(
        "AUTHENTICATION_FAILED",
        `Provider rejected ${apiKey}`,
      ),
    );
    expect(message).not.toContain(apiKey);
    expect(message).not.toContain("GEMINI_API_KEY");
  });
});
