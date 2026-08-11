import * as z from "zod";

const necessitySchema = z.enum([
  "essential",
  "mostly_essential",
  "discretionary",
  "potentially_reducible",
  "needs_context",
]);
const severitySchema = z.enum(["low", "medium", "high"]);
const shortText = z.string().trim().min(1).max(160);
const explanationText = z.string().trim().min(1).max(800);

export const insightReportSchema = z.object({
  schemaVersion: z.literal("2"),
  period: z.object({ start: z.string(), end: z.string() }),
  executiveSummary: explanationText,
  biggestExpenses: z
    .array(
      z.object({
        categoryKey: shortText,
        categoryName: shortText,
        amount: z.number().nonnegative(),
        percentageOfSpending: z.number().min(0).max(100),
        necessity: necessitySchema,
        explanation: explanationText,
      }),
    )
    .max(5),
  overspendingAreas: z
    .array(
      z.object({
        categoryKey: shortText,
        reason: explanationText,
        evidence: explanationText,
        severity: severitySchema,
      }),
    )
    .max(5),
  savingsOpportunities: z
    .array(
      z.object({
        rank: z.number().int().min(1).max(5),
        categoryKey: shortText.nullable(),
        title: shortText,
        reason: explanationText,
        action: explanationText,
        estimatedMonthlySavingMin: z.number().nonnegative().nullable(),
        estimatedMonthlySavingMax: z.number().nonnegative().nullable(),
        difficulty: z.enum(["easy", "moderate", "hard"]),
        impact: severitySchema,
      }),
    )
    .max(5),
  protectedExpenses: z
    .array(
      z.object({
        categoryKey: shortText,
        reason: explanationText,
      }),
    )
    .max(5),
  positiveHabits: z.array(explanationText).max(6),
  nextMonthTargets: z
    .array(
      z.object({
        title: shortText,
        target: shortText,
        reason: explanationText,
      }),
    )
    .max(3),
  questionsForUser: z.array(explanationText).max(5),
  disclaimer: explanationText,
});

export type InsightReportOutput = z.infer<typeof insightReportSchema>;

export const insightReportJsonSchema = z.toJSONSchema(insightReportSchema);
