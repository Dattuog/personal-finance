import Decimal from "decimal.js";
import { ratioOrNull } from "@/lib/money/decimal";
import type { AnalyticsTransaction, FinancialSummary } from "./types";

const ZERO = new Decimal(0);

export function calculateFinancialSummary(
  transactions: readonly AnalyticsTransaction[],
): FinancialSummary {
  const active = transactions.filter(
    (transaction) => !transaction.deletedAt && transaction.status !== "PENDING",
  );

  let income = ZERO;
  let expenses = ZERO;
  let refunds = ZERO;
  let investments = ZERO;
  let transfers = ZERO;
  let essentialExpenses = ZERO;
  let discretionaryExpenses = ZERO;
  let fixedExpenses = ZERO;
  let variableExpenses = ZERO;
  let familySupport = ZERO;

  for (const transaction of active) {
    const amount = new Decimal(transaction.amount);

    switch (transaction.type) {
      case "INCOME":
        income = income.plus(amount);
        break;
      case "EXPENSE":
        expenses = expenses.plus(amount);
        if (transaction.necessity === "ESSENTIAL")
          essentialExpenses = essentialExpenses.plus(amount);
        if (transaction.necessity === "DISCRETIONARY") {
          discretionaryExpenses = discretionaryExpenses.plus(amount);
        }
        if (transaction.costBehaviour === "FIXED")
          fixedExpenses = fixedExpenses.plus(amount);
        if (transaction.costBehaviour === "VARIABLE")
          variableExpenses = variableExpenses.plus(amount);
        if (transaction.categorySlug === "family-support")
          familySupport = familySupport.plus(amount);
        break;
      case "REFUND":
        refunds = refunds.plus(amount);
        if (transaction.necessity === "ESSENTIAL")
          essentialExpenses = essentialExpenses.minus(amount);
        if (transaction.necessity === "DISCRETIONARY") {
          discretionaryExpenses = discretionaryExpenses.minus(amount);
        }
        if (transaction.costBehaviour === "FIXED")
          fixedExpenses = fixedExpenses.minus(amount);
        if (transaction.costBehaviour === "VARIABLE")
          variableExpenses = variableExpenses.minus(amount);
        if (transaction.categorySlug === "family-support")
          familySupport = familySupport.minus(amount);
        break;
      case "INVESTMENT":
        investments = investments.plus(amount);
        break;
      case "TRANSFER":
        transfers = transfers.plus(amount);
        break;
      case "ADJUSTMENT":
        break;
    }
  }

  const netExpenses = expenses.minus(refunds);
  const cashSurplusBeforeInvestments = income.minus(netExpenses);
  const cashRemainingAfterInvestments =
    cashSurplusBeforeInvestments.minus(investments);

  return {
    income,
    expenses,
    refunds,
    netExpenses,
    investments,
    transfers,
    cashSurplusBeforeInvestments,
    cashRemainingAfterInvestments,
    essentialExpenses: Decimal.max(essentialExpenses, ZERO),
    discretionaryExpenses: Decimal.max(discretionaryExpenses, ZERO),
    fixedExpenses: Decimal.max(fixedExpenses, ZERO),
    variableExpenses: Decimal.max(variableExpenses, ZERO),
    familySupport: Decimal.max(familySupport, ZERO),
    savingsRate: income.isZero()
      ? null
      : ratioOrNull(Decimal.max(cashSurplusBeforeInvestments, ZERO), income),
    investmentRate: ratioOrNull(investments, income),
  };
}

export function calculateBudgetUtilization(
  netBudgetedExpenses: Decimal.Value,
  budgetAmount: Decimal.Value,
): Decimal | null {
  const budget = new Decimal(budgetAmount);
  if (!budget.greaterThan(0)) return null;
  return new Decimal(netBudgetedExpenses).dividedBy(budget);
}
