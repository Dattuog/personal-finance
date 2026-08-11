import type { InsightPayload } from "./privacy";
import type { InsightReportOutput } from "./schema";

export function constrainInsightOutput(
  report: InsightReportOutput,
  payload: InsightPayload,
): InsightReportOutput {
  const categoryByKey = new Map(
    payload.consumption.categories.map((category) => [category.key, category]),
  );
  const allowedRecommendationKeys = new Set([
    ...categoryByKey.keys(),
    ...payload.candidateSavingsOpportunities.flatMap((candidate) =>
      candidate.categoryKey ? [candidate.categoryKey] : [],
    ),
  ]);
  const rangeIsSupported = (
    categoryKey: string | null,
    minimum: number | null,
    maximum: number | null,
  ) => {
    if (minimum === null && maximum === null) return true;
    return payload.candidateSavingsOpportunities.some(
      (candidate) =>
        candidate.categoryKey === categoryKey &&
        candidate.estimatedMonthlySavingMin !== null &&
        candidate.estimatedMonthlySavingMax !== null &&
        minimum !== null &&
        maximum !== null &&
        Math.abs(candidate.estimatedMonthlySavingMin - minimum) < 0.01 &&
        Math.abs(candidate.estimatedMonthlySavingMax - maximum) < 0.01,
    );
  };
  const seenCategories = new Set<string>();
  const verifiedNecessity = {
    essential: "essential",
    mostly_essential: "mostly_essential",
    discretionary: "discretionary",
    mixed: "needs_context",
    unknown: "needs_context",
  } as const;

  return {
    ...report,
    period: { start: payload.period.start, end: payload.period.end },
    biggestExpenses: report.biggestExpenses.flatMap((expense) => {
      const verified = categoryByKey.get(expense.categoryKey);
      if (!verified || seenCategories.has(expense.categoryKey)) return [];
      seenCategories.add(expense.categoryKey);
      return [
        {
          ...expense,
          categoryName: verified.name,
          amount: verified.amount,
          percentageOfSpending: verified.percentageOfConsumption,
          necessity: verifiedNecessity[verified.essentiality],
        },
      ];
    }),
    savingsOpportunities: report.savingsOpportunities.map((opportunity) => {
      const supported = rangeIsSupported(
        opportunity.categoryKey,
        opportunity.estimatedMonthlySavingMin,
        opportunity.estimatedMonthlySavingMax,
      );
      return {
        ...opportunity,
        categoryKey:
          opportunity.categoryKey === null ||
          allowedRecommendationKeys.has(opportunity.categoryKey)
            ? opportunity.categoryKey
            : null,
        estimatedMonthlySavingMin: supported
          ? opportunity.estimatedMonthlySavingMin
          : null,
        estimatedMonthlySavingMax: supported
          ? opportunity.estimatedMonthlySavingMax
          : null,
      };
    }),
    overspendingAreas: report.overspendingAreas.filter((area) =>
      allowedRecommendationKeys.has(area.categoryKey),
    ),
    protectedExpenses: report.protectedExpenses.filter((expense) =>
      categoryByKey.has(expense.categoryKey),
    ),
    disclaimer:
      "AI-generated insights are provided for informational purposes and may not reflect your complete financial circumstances. Verify important financial, tax, or investment decisions independently.",
  };
}
