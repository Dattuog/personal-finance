import type Decimal from "decimal.js";

export type AnalyticsTransactionType =
  "INCOME" | "EXPENSE" | "TRANSFER" | "INVESTMENT" | "REFUND" | "ADJUSTMENT";

export interface AnalyticsTransaction {
  id: string;
  type: AnalyticsTransactionType;
  amount: Decimal.Value;
  date: Date;
  deletedAt?: Date | null;
  status?: "PENDING" | "CLEARED" | "RECONCILED";
  categorySlug?: string | null;
  necessity?: "ESSENTIAL" | "DISCRETIONARY" | "NEUTRAL" | null;
  costBehaviour?: "FIXED" | "VARIABLE" | "MIXED" | null;
  isKnownRecurring?: boolean;
}

export interface FinancialSummary {
  income: Decimal;
  expenses: Decimal;
  refunds: Decimal;
  netExpenses: Decimal;
  investments: Decimal;
  transfers: Decimal;
  cashSurplusBeforeInvestments: Decimal;
  cashRemainingAfterInvestments: Decimal;
  essentialExpenses: Decimal;
  discretionaryExpenses: Decimal;
  fixedExpenses: Decimal;
  variableExpenses: Decimal;
  familySupport: Decimal;
  savingsRate: Decimal | null;
  investmentRate: Decimal | null;
}
