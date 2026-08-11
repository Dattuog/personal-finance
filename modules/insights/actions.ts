"use server";

import { createHash } from "node:crypto";
import { startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { AIProviderError, safeAIProviderMessage } from "./errors";
import { createFinanceAIProvider } from "./provider-factory";
import { MONTHLY_INSIGHT_PROMPT_VERSION } from "@/prompts/monthly-insight.v3";
import { constrainInsightOutput } from "./output-safety";
import {
  getInsightsDashboardData,
  insightPeriodDates,
} from "./dashboard-service";
import type { GenerateInsightActionState } from "./action-state";

const analyticsVersion = "financial-summary.v1";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function generateInsightAction(
  previous: GenerateInsightActionState,
): Promise<GenerateInsightActionState> {
  void previous;
  const user = await requireUser();
  const dashboard = await getInsightsDashboardData(user.id);
  if (!dashboard.aiEnabled) {
    return {
      error:
        "Enable AI-generated explanations in Settings before requesting a review.",
      message: null,
    };
  }

  const env = getEnv();
  let aiProvider;
  try {
    aiProvider = createFinanceAIProvider();
  } catch (error) {
    return {
      error: safeAIProviderMessage(error),
      message: null,
    };
  }

  const payload = dashboard.insightPayload;
  const inputHash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  const dates = insightPeriodDates(dashboard.range);
  const identity = {
    userId: user.id,
    reportType: "ON_DEMAND" as const,
    ...dates,
    analyticsVersion,
    promptVersion: MONTHLY_INSIGHT_PROMPT_VERSION,
    inputHash,
    provider: aiProvider.provider,
    model: aiProvider.model,
  };
  const existing = await db.insightReport.findFirst({ where: identity });

  if (existing?.status === "COMPLETED") {
    revalidatePath("/insights");
    return {
      error: null,
      message: "Your current review was already up to date.",
    };
  }
  if (
    existing?.status === "PENDING" &&
    existing.updatedAt > new Date(Date.now() - 2 * 60 * 1000)
  ) {
    return {
      error: null,
      message: "An AI review is already being generated for these metrics.",
    };
  }

  const generatedThisMonth = await db.insightReport.count({
    where: {
      userId: user.id,
      createdAt: { gte: startOfMonth(new Date()) },
    },
  });
  if (generatedThisMonth >= env.AI_MONTHLY_USER_REQUEST_LIMIT) {
    return {
      error: "You have reached this month’s AI review limit.",
      message: null,
    };
  }

  const burstLimit = await consumeRateLimit({
    scope: "ai-insight-generation",
    subject: user.id,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!burstLimit.allowed) {
    return {
      error:
        "AI review requests are temporarily limited. Your calculated insights remain available; try again shortly.",
      message: null,
    };
  }

  let pendingReport;
  if (existing) {
    pendingReport = await db.insightReport.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        structuredOutput: Prisma.JsonNull,
        tokenUsage: Prisma.JsonNull,
        errorCode: null,
        generatedAt: null,
      },
    });
  } else {
    try {
      pendingReport = await db.insightReport.create({
        data: {
          ...identity,
          status: "PENDING",
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          error: null,
          message: "An AI review is already being generated for these metrics.",
        };
      }
      throw error;
    }
  }

  try {
    const generated = await aiProvider.generateFinancialInsight(payload);
    const output = constrainInsightOutput(generated.insight, payload);
    await db.insightReport.update({
      where: { id: pendingReport.id },
      data: {
        status: "COMPLETED",
        structuredOutput: output as Prisma.InputJsonValue,
        tokenUsage: {
          provider: generated.usage.provider,
          model: generated.usage.model,
          inputTokens: generated.usage.inputTokens,
          outputTokens: generated.usage.outputTokens,
          thoughtTokens: generated.usage.thoughtTokens,
          totalTokens: generated.usage.totalTokens,
        },
        errorCode: null,
        generatedAt: new Date(),
      },
    });
    revalidatePath("/insights");
    return {
      error: null,
      message: "AI review generated from the latest calculated metrics.",
    };
  } catch (error) {
    try {
      await db.insightReport.update({
        where: { id: pendingReport.id },
        data: {
          status: "FAILED",
          errorCode:
            error instanceof AIProviderError
              ? error.code
              : "UNKNOWN_PROVIDER_ERROR",
        },
      });
    } catch {
      // Preserve the original generation error if the status update also fails.
    }
    return {
      error: safeAIProviderMessage(error),
      message: null,
    };
  }
}
