import { addMonths, subMilliseconds } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export interface MonthRange {
  start: Date;
  end: Date;
}

export function getMonthRange(
  instant: Date,
  timezone: string,
  financialMonthStartDay = 1,
): MonthRange {
  if (
    !Number.isInteger(financialMonthStartDay) ||
    financialMonthStartDay < 1 ||
    financialMonthStartDay > 28
  ) {
    throw new Error("Financial month start day must be between 1 and 28.");
  }

  const local = toZonedTime(instant, timezone);
  const belongsToPreviousMonth = local.getDate() < financialMonthStartDay;
  const baseMonth = belongsToPreviousMonth ? addMonths(local, -1) : local;
  const localStart = new Date(
    baseMonth.getFullYear(),
    baseMonth.getMonth(),
    financialMonthStartDay,
    0,
    0,
    0,
    0,
  );
  const localNextStart = addMonths(localStart, 1);

  return {
    start: fromZonedTime(localStart, timezone),
    end: subMilliseconds(fromZonedTime(localNextStart, timezone), 1),
  };
}
