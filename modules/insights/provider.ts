import type { InsightPayload } from "./privacy";
import type { InsightReportOutput } from "./schema";

export type VerifiedFinancialInsightInput = InsightPayload;

export interface FinanceAIUsage {
  provider: "gemini";
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  thoughtTokens: number | null;
  totalTokens: number | null;
}

export interface FinanceAIResult {
  insight: InsightReportOutput;
  usage: FinanceAIUsage;
}

export interface FinanceAIProvider {
  readonly provider: "gemini";
  readonly model: string;
  generateFinancialInsight(
    input: VerifiedFinancialInsightInput,
  ): Promise<FinanceAIResult>;
}
