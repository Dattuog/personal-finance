import Decimal from "decimal.js";

export type BillingFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export function monthlyEquivalent(
  amount: Decimal.Value,
  frequency: BillingFrequency,
): Decimal {
  const value = new Decimal(amount);
  switch (frequency) {
    case "WEEKLY":
      return value.times(52).dividedBy(12).toDecimalPlaces(2);
    case "MONTHLY":
      return value.toDecimalPlaces(2);
    case "QUARTERLY":
      return value.dividedBy(3).toDecimalPlaces(2);
    case "YEARLY":
      return value.dividedBy(12).toDecimalPlaces(2);
  }
}
