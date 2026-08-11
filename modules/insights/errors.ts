export type AIProviderErrorCode =
  | "AI_DISABLED"
  | "MISSING_CONFIGURATION"
  | "AUTHENTICATION_FAILED"
  | "MODEL_NOT_AVAILABLE"
  | "RATE_LIMITED"
  | "REQUEST_TIMEOUT"
  | "EMPTY_AI_RESPONSE"
  | "INVALID_AI_JSON"
  | "INVALID_AI_SCHEMA"
  | "PROVIDER_UNAVAILABLE"
  | "UNKNOWN_PROVIDER_ERROR";

export class AIProviderError extends Error {
  constructor(
    public readonly code: AIProviderErrorCode,
    message: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export function safeAIProviderMessage(error: unknown): string {
  if (!(error instanceof AIProviderError))
    return "AI commentary is temporarily unavailable.";

  switch (error.code) {
    case "AI_DISABLED":
      return "Enable AI-generated explanations in Settings before requesting a review.";
    case "MISSING_CONFIGURATION":
      return "AI is enabled for your profile, but Gemini is not configured on the server.";
    case "AUTHENTICATION_FAILED":
      return "Gemini authentication failed. Ask the application administrator to check the server configuration.";
    case "MODEL_NOT_AVAILABLE":
      return "The configured Gemini model is unavailable. Ask the application administrator to check the model setting.";
    case "RATE_LIMITED":
      return "Gemini is temporarily rate-limited. Your calculated insights remain available; try the AI review again later.";
    case "REQUEST_TIMEOUT":
      return "Gemini took too long to respond. Your calculated insights remain available; try again later.";
    case "EMPTY_AI_RESPONSE":
    case "INVALID_AI_JSON":
    case "INVALID_AI_SCHEMA":
      return "Gemini returned an unusable review. Your calculated insights are still available; try again later.";
    case "PROVIDER_UNAVAILABLE":
    case "UNKNOWN_PROVIDER_ERROR":
      return "Gemini is temporarily unavailable. Your calculated insights remain available.";
  }
}
