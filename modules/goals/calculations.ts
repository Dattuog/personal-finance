import Decimal from "decimal.js";

export interface GoalContributionResult {
  remaining: Decimal;
  monthsRemaining: number;
  requiredMonthlyContribution: Decimal | null;
  isPastDue: boolean;
}

export function calculateGoalContribution(input: {
  targetAmount: Decimal.Value;
  currentAmount: Decimal.Value;
  targetDate: Date;
  asOf: Date;
}): GoalContributionResult {
  const remaining = Decimal.max(
    new Decimal(input.targetAmount).minus(input.currentAmount),
    0,
  );
  const monthsRemaining = Math.max(
    0,
    (input.targetDate.getUTCFullYear() - input.asOf.getUTCFullYear()) * 12 +
      input.targetDate.getUTCMonth() -
      input.asOf.getUTCMonth(),
  );

  if (remaining.isZero()) {
    return {
      remaining,
      monthsRemaining,
      requiredMonthlyContribution: new Decimal(0),
      isPastDue: false,
    };
  }
  if (monthsRemaining === 0) {
    return {
      remaining,
      monthsRemaining,
      requiredMonthlyContribution: null,
      isPastDue: true,
    };
  }
  return {
    remaining,
    monthsRemaining,
    requiredMonthlyContribution: remaining
      .dividedBy(monthsRemaining)
      .toDecimalPlaces(2),
    isPastDue: false,
  };
}

export function emergencyFundMonths(
  liquidEmergencySavings: Decimal.Value,
  averageMonthlyEssentialExpenses: Decimal.Value,
): Decimal | null {
  const expenses = new Decimal(averageMonthlyEssentialExpenses);
  return expenses.greaterThan(0)
    ? new Decimal(liquidEmergencySavings).dividedBy(expenses).toDecimalPlaces(2)
    : null;
}
