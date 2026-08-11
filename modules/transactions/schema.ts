import { z } from "zod";
import { parseMoneyInput } from "@/lib/money/decimal";
import { currencyCodeSchema } from "@/lib/validation/localization";

const optionalId = z.string().trim().min(1).nullable().optional();

export const transactionInputSchema = z
  .object({
    type: z.enum([
      "INCOME",
      "EXPENSE",
      "TRANSFER",
      "INVESTMENT",
      "REFUND",
      "ADJUSTMENT",
    ]),
    amount: z.string().transform((value, context) => {
      try {
        return parseMoneyInput(value);
      } catch (error) {
        context.addIssue({
          code: "custom",
          message: error instanceof Error ? error.message : "Invalid amount.",
        });
        return z.NEVER;
      }
    }),
    currencyCode: currencyCodeSchema,
    transactionDate: z.coerce.date(),
    sourceAccountId: optionalId,
    destinationAccountId: optionalId,
    categoryId: optionalId,
    parentTransactionId: optionalId,
    merchant: z.string().trim().max(120).nullable().optional(),
    description: z.string().trim().max(240).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    status: z.enum(["PENDING", "CLEARED", "RECONCILED"]).default("CLEARED"),
  })
  .superRefine((value, context) => {
    const requireField = (field: keyof typeof value, message: string) => {
      if (!value[field])
        context.addIssue({ code: "custom", path: [field], message });
    };

    if (value.type === "INCOME") {
      requireField(
        "destinationAccountId",
        "Choose the account receiving this income.",
      );
      requireField("categoryId", "Choose an income category.");
    }
    if (value.type === "EXPENSE") {
      requireField(
        "sourceAccountId",
        "Choose the account used for this expense.",
      );
      requireField("categoryId", "Choose an expense category.");
    }
    if (value.type === "TRANSFER" || value.type === "INVESTMENT") {
      requireField("sourceAccountId", "Choose the source account.");
      requireField("destinationAccountId", "Choose the destination account.");
      if (
        value.sourceAccountId &&
        value.destinationAccountId &&
        value.sourceAccountId === value.destinationAccountId
      ) {
        context.addIssue({
          code: "custom",
          path: ["destinationAccountId"],
          message: "Source and destination accounts must be different.",
        });
      }
      if (value.type === "INVESTMENT") {
        requireField("categoryId", "Choose an investment category.");
      }
    }
    if (value.type === "REFUND") {
      requireField(
        "destinationAccountId",
        "Choose the account receiving this refund.",
      );
    }
  });

export type TransactionInput = z.infer<typeof transactionInputSchema>;
