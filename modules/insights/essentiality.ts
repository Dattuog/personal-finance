export const expenseEssentialityValues = [
  "essential",
  "mostly_essential",
  "discretionary",
  "mixed",
  "unknown",
] as const;

export type ExpenseEssentiality = (typeof expenseEssentialityValues)[number];

const essentialCategoryKeys = new Set([
  "rent",
  "electricity",
  "water",
  "gas",
  "healthcare",
  "insurance",
  "internet",
  "mobile",
  "loan-interest",
]);
const mostlyEssentialCategoryKeys = new Set(["groceries"]);
const discretionaryCategoryKeys = new Set([
  "dining-out",
  "restaurants",
  "food-delivery",
  "delivery",
  "entertainment",
]);
const mixedCategoryKeys = new Set(["food", "shopping"]);
const contextDependentCategoryKeys = new Set([
  "transport",
  "subscriptions",
  "ai-subscriptions",
  "software-subscriptions",
]);

export function defaultExpenseEssentiality(input: {
  key: string;
  necessity?: "ESSENTIAL" | "DISCRETIONARY" | "NEUTRAL" | null;
}): ExpenseEssentiality {
  if (essentialCategoryKeys.has(input.key)) return "essential";
  if (mostlyEssentialCategoryKeys.has(input.key)) return "mostly_essential";
  if (discretionaryCategoryKeys.has(input.key)) return "discretionary";
  if (mixedCategoryKeys.has(input.key)) return "mixed";
  if (contextDependentCategoryKeys.has(input.key)) return "unknown";

  if (input.necessity === "ESSENTIAL") return "essential";
  if (input.necessity === "DISCRETIONARY") return "discretionary";
  return "unknown";
}

export function expenseEssentialityLabel(value: ExpenseEssentiality) {
  return value.replaceAll("_", " ");
}
