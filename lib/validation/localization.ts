import { z } from "zod";

const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"));

export const currencyCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .regex(/^[A-Z]{3}$/u, "Enter a three-letter ISO currency code.")
      .refine(
        (value) => supportedCurrencies.has(value),
        "Choose a supported currency code.",
      ),
  );

export const localeSchema = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .refine((value) => {
    try {
      return Intl.DateTimeFormat.supportedLocalesOf([value]).length === 1;
    } catch {
      return false;
    }
  }, "Choose a supported locale.");

export const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid IANA timezone.");
