import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = Decimal.Value;

const moneyPattern = /^\d+(?:\.\d{1,2})?$/;
const signedMoneyPattern = /^-?\d+(?:\.\d{1,2})?$/;
const maximumDatabaseMoney = new Decimal("9999999999999999.99");

function enforceDatabaseRange(amount: Decimal): Decimal {
  if (amount.abs().greaterThan(maximumDatabaseMoney)) {
    throw new Error("Amount is too large.");
  }
  return amount.toDecimalPlaces(2);
}

export function parseMoneyInput(input: string): Decimal {
  const normalized = input.trim().replaceAll(",", "");

  if (!moneyPattern.test(normalized)) {
    throw new Error(
      "Enter a positive amount with no more than two decimal places.",
    );
  }

  const amount = new Decimal(normalized);
  if (!amount.greaterThan(0)) {
    throw new Error("Amount must be greater than zero.");
  }

  return enforceDatabaseRange(amount);
}

export function parseSignedMoneyInput(input: string): Decimal {
  const normalized = input.trim().replaceAll(",", "");
  if (!signedMoneyPattern.test(normalized)) {
    throw new Error("Enter an amount with no more than two decimal places.");
  }
  return enforceDatabaseRange(new Decimal(normalized));
}

export function decimal(value: MoneyInput): Decimal {
  return new Decimal(value);
}

export function sumMoney(values: readonly MoneyInput[]): Decimal {
  return values.reduce<Decimal>(
    (sum, value) => sum.plus(value),
    new Decimal(0),
  );
}

export function ratioOrNull(
  numerator: MoneyInput,
  denominator: MoneyInput,
): Decimal | null {
  const divisor = decimal(denominator);
  return divisor.isZero() ? null : decimal(numerator).dividedBy(divisor);
}

export function formatMoney(
  value: MoneyInput,
  currency = "INR",
  locale = "en-IN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(decimal(value).toDecimalPlaces(2).toNumber());
}

export function serializeMoney(value: MoneyInput): string {
  return decimal(value).toFixed(2);
}
