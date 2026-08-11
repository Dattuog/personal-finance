import { createHash } from "node:crypto";

interface FingerprintInput {
  userId: string;
  accountId: string;
  date: string;
  amount: string;
  description: string;
  transactionType: string;
}

export function createImportFingerprint(input: FingerprintInput): string {
  const canonical = [
    input.userId,
    input.accountId,
    input.date.trim(),
    input.amount.trim().replaceAll(",", ""),
    input.description.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN"),
    input.transactionType.trim().toUpperCase(),
  ].join("\u001f");

  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function escapeCsvFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
