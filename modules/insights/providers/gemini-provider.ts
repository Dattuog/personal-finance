import "server-only";

import { ApiError, GoogleGenAI } from "@google/genai";
import { AIProviderError, type AIProviderErrorCode } from "../errors";
import type {
  FinanceAIProvider,
  FinanceAIResult,
  VerifiedFinancialInsightInput,
} from "../provider";
import { insightReportJsonSchema, insightReportSchema } from "../schema";
import { monthlyInsightSystemPrompt } from "@/prompts/monthly-insight.v3";

interface GeminiProviderConfig {
  apiKey: string;
  model: string;
  maxOutputTokens: number;
  requestTimeoutMs?: number;
}

interface GeminiInteractionResponse {
  output_text?: string | undefined;
  usage?:
    | {
        total_input_tokens?: number | undefined;
        total_output_tokens?: number | undefined;
        total_thought_tokens?: number | undefined;
        total_tokens?: number | undefined;
      }
    | undefined;
}

export interface GeminiInteractionRequest {
  model: string;
  stream: false;
  store: false;
  system_instruction: string;
  input: string;
  response_format: {
    type: "text";
    mime_type: "application/json";
    schema: Record<string, unknown>;
  };
  generation_config: {
    max_output_tokens: number;
  };
}

interface GeminiProviderDependencies {
  requestInteraction?: (
    request: GeminiInteractionRequest,
  ) => Promise<GeminiInteractionResponse>;
  sleep?: (milliseconds: number) => Promise<void>;
  random?: () => number;
  maxAttempts?: number;
}

const transientErrorCodes = new Set<AIProviderErrorCode>([
  "RATE_LIMITED",
  "REQUEST_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
]);

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const errorStatus = (error: unknown) => {
  if (error instanceof ApiError) return error.status;
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  )
    return error.status;
  return null;
};

const errorName = (error: unknown) =>
  error instanceof Error ? error.name.toLocaleLowerCase() : "";

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message.toLocaleLowerCase()
    : typeof error === "object" && error !== null && "message" in error
      ? String(error.message).toLocaleLowerCase()
      : "";

export function mapGeminiError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;

  const status = errorStatus(error);
  const name = errorName(error);
  const message = errorMessage(error);
  if (status === 401 || status === 403)
    return new AIProviderError(
      "AUTHENTICATION_FAILED",
      "Gemini rejected the server credentials.",
    );
  if (status === 404)
    return new AIProviderError(
      "MODEL_NOT_AVAILABLE",
      "The configured Gemini model was not found.",
    );
  if (status === 429 || message.includes("resource_exhausted"))
    return new AIProviderError("RATE_LIMITED", "Gemini rate limit reached.");
  if (
    name.includes("abort") ||
    name.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("timeout")
  )
    return new AIProviderError("REQUEST_TIMEOUT", "Gemini request timed out.");
  if ([500, 502, 503, 504].includes(status ?? 0) || error instanceof TypeError)
    return new AIProviderError(
      "PROVIDER_UNAVAILABLE",
      "Gemini is temporarily unavailable.",
    );
  return new AIProviderError(
    "UNKNOWN_PROVIDER_ERROR",
    "Gemini request failed.",
  );
}

export class GeminiFinanceProvider implements FinanceAIProvider {
  readonly provider = "gemini" as const;
  readonly model: string;
  private readonly maxOutputTokens: number;
  private readonly requestInteraction: (
    request: GeminiInteractionRequest,
  ) => Promise<GeminiInteractionResponse>;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly random: () => number;
  private readonly maxAttempts: number;

  constructor(
    config: GeminiProviderConfig,
    dependencies: GeminiProviderDependencies = {},
  ) {
    if (!config.apiKey.trim())
      throw new AIProviderError(
        "MISSING_CONFIGURATION",
        "GEMINI_API_KEY is required for Gemini insight generation.",
      );
    if (!config.model.trim())
      throw new AIProviderError(
        "MISSING_CONFIGURATION",
        "GEMINI_MODEL is required for Gemini insight generation.",
      );

    this.model = config.model;
    this.maxOutputTokens = config.maxOutputTokens;
    this.sleep = dependencies.sleep ?? wait;
    this.random = dependencies.random ?? Math.random;
    this.maxAttempts = Math.max(1, Math.min(dependencies.maxAttempts ?? 3, 3));

    if (dependencies.requestInteraction) {
      this.requestInteraction = dependencies.requestInteraction;
    } else {
      const client = new GoogleGenAI({ apiKey: config.apiKey });
      this.requestInteraction = (request) =>
        client.interactions.create(request, {
          timeout: config.requestTimeoutMs ?? 20_000,
          maxRetries: 0,
        });
    }
  }

  async generateFinancialInsight(
    input: VerifiedFinancialInsightInput,
  ): Promise<FinanceAIResult> {
    let lastError: AIProviderError | null = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return await this.generateOnce(input);
      } catch (error) {
        const mapped = mapGeminiError(error);
        lastError = mapped;
        if (
          !transientErrorCodes.has(mapped.code) ||
          attempt === this.maxAttempts
        )
          throw mapped;

        const delay =
          250 * 2 ** (attempt - 1) + Math.floor(this.random() * 100);
        await this.sleep(delay);
      }
    }

    throw (
      lastError ??
      new AIProviderError("UNKNOWN_PROVIDER_ERROR", "Gemini request failed.")
    );
  }

  private async generateOnce(
    input: VerifiedFinancialInsightInput,
  ): Promise<FinanceAIResult> {
    const interaction = await this.requestInteraction({
      model: this.model,
      stream: false,
      system_instruction: monthlyInsightSystemPrompt,
      input: JSON.stringify({
        task: "Generate a personal-finance insight report.",
        analytics: input,
      }),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: insightReportJsonSchema,
      },
      generation_config: {
        max_output_tokens: this.maxOutputTokens,
      },
      store: false,
    });

    const outputText = interaction.output_text;
    if (!outputText?.trim())
      throw new AIProviderError(
        "EMPTY_AI_RESPONSE",
        "Gemini returned an empty response.",
      );

    let decodedOutput: unknown;
    try {
      decodedOutput = JSON.parse(outputText);
    } catch {
      throw new AIProviderError(
        "INVALID_AI_JSON",
        "Gemini returned invalid JSON.",
      );
    }

    const validation = insightReportSchema.safeParse(decodedOutput);
    if (!validation.success)
      throw new AIProviderError(
        "INVALID_AI_SCHEMA",
        "Gemini output did not match the financial insight schema.",
        {
          validationIssues: validation.error.issues.map((issue) => ({
            code: issue.code,
            path: issue.path,
            message: issue.message,
          })),
        },
      );

    return {
      insight: validation.data,
      usage: {
        provider: "gemini",
        model: this.model,
        inputTokens: interaction.usage?.total_input_tokens ?? null,
        outputTokens: interaction.usage?.total_output_tokens ?? null,
        thoughtTokens: interaction.usage?.total_thought_tokens ?? null,
        totalTokens: interaction.usage?.total_tokens ?? null,
      },
    };
  }
}
