import "server-only";

import { getEnv } from "@/lib/env";
import { AIProviderError } from "./errors";
import type { FinanceAIProvider } from "./provider";
import { GeminiFinanceProvider } from "./providers/gemini-provider";

export function createFinanceAIProvider(): FinanceAIProvider {
  const env = getEnv();
  if (env.AI_PROVIDER !== "gemini")
    throw new AIProviderError(
      "MISSING_CONFIGURATION",
      "The configured AI provider is unsupported.",
    );
  if (!env.GEMINI_API_KEY)
    throw new AIProviderError(
      "MISSING_CONFIGURATION",
      "GEMINI_API_KEY is required for Gemini insight generation.",
    );

  return new GeminiFinanceProvider({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
  });
}
