import Decimal from "decimal.js";

export interface HealthComponent {
  key: string;
  earned: Decimal.Value | null;
  possible: Decimal.Value;
  explanation: string;
}

export interface HealthScore {
  score: number | null;
  label: "excellent" | "good" | "needs_attention" | "insufficient_data";
  components: readonly HealthComponent[];
}

export function calculateHealthScore(
  components: readonly HealthComponent[],
): HealthScore {
  const available = components.filter(
    (component): component is HealthComponent & { earned: Decimal.Value } =>
      component.earned !== null,
  );
  if (available.length === 0) {
    return { score: null, label: "insufficient_data", components };
  }

  const earned = available.reduce(
    (sum, component) => sum.plus(component.earned),
    new Decimal(0),
  );
  const possible = available.reduce(
    (sum, component) => sum.plus(component.possible),
    new Decimal(0),
  );
  if (possible.isZero())
    return { score: null, label: "insufficient_data", components };

  const score = Decimal.min(
    100,
    Decimal.max(0, earned.dividedBy(possible).times(100)),
  )
    .toDecimalPlaces(0)
    .toNumber();
  const label =
    score >= 80 ? "excellent" : score >= 60 ? "good" : "needs_attention";
  return { score, label, components };
}
