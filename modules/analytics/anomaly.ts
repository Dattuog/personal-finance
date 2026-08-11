import Decimal from "decimal.js";

export interface AnomalyResult {
  isAnomaly: boolean;
  reasonCode:
    | "INSUFFICIENT_HISTORY"
    | "KNOWN_RECURRING"
    | "ABOVE_CATEGORY_BASELINE"
    | "WITHIN_RANGE";
  confidence: "low" | "medium" | "high";
  median: Decimal | null;
  medianAbsoluteDeviation: Decimal | null;
  deviationMultiple: Decimal | null;
}

function median(values: readonly Decimal[]): Decimal {
  const sorted = [...values].sort((a, b) => a.comparedTo(b));
  const midpoint = Math.floor(sorted.length / 2);
  const current = sorted[midpoint];
  if (!current) return new Decimal(0);
  if (sorted.length % 2 === 1) return current;
  const previous = sorted[midpoint - 1] ?? current;
  return previous.plus(current).dividedBy(2);
}

export function detectAmountAnomaly(input: {
  amount: Decimal.Value;
  historicalAmounts: readonly Decimal.Value[];
  isKnownRecurring?: boolean;
  minimumSampleSize?: number;
  threshold?: number;
}): AnomalyResult {
  const minimumSampleSize = input.minimumSampleSize ?? 6;
  if (input.historicalAmounts.length < minimumSampleSize) {
    return {
      isAnomaly: false,
      reasonCode: "INSUFFICIENT_HISTORY",
      confidence: "low",
      median: null,
      medianAbsoluteDeviation: null,
      deviationMultiple: null,
    };
  }

  const values = input.historicalAmounts.map((value) => new Decimal(value));
  const baseline = median(values);
  const mad = median(values.map((value) => value.minus(baseline).abs()));

  if (input.isKnownRecurring) {
    return {
      isAnomaly: false,
      reasonCode: "KNOWN_RECURRING",
      confidence: "high",
      median: baseline,
      medianAbsoluteDeviation: mad,
      deviationMultiple: null,
    };
  }

  const amount = new Decimal(input.amount);
  const threshold = new Decimal(input.threshold ?? 3.5);
  const deviation = amount.minus(baseline);
  const multiple = mad.isZero()
    ? deviation.isPositive()
      ? new Decimal(Infinity)
      : new Decimal(0)
    : deviation.dividedBy(mad);
  const isAnomaly = deviation.isPositive() && multiple.greaterThan(threshold);

  return {
    isAnomaly,
    reasonCode: isAnomaly ? "ABOVE_CATEGORY_BASELINE" : "WITHIN_RANGE",
    confidence: isAnomaly && values.length >= 12 ? "high" : "medium",
    median: baseline,
    medianAbsoluteDeviation: mad,
    deviationMultiple: multiple.isFinite() ? multiple : null,
  };
}
