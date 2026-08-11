"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";
import { parseSignedMoneyInput } from "@/lib/money/decimal";
import { currencyCodeSchema } from "@/lib/validation/localization";

const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum([
    "BANK",
    "CASH",
    "WALLET",
    "CREDIT_CARD",
    "INVESTMENT",
    "LOAN",
    "OTHER",
  ]),
  currencyCode: currencyCodeSchema,
  openingBalance: z.string().transform((value, context) => {
    try {
      return parseSignedMoneyInput(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Invalid balance.",
      });
      return z.NEVER;
    }
  }),
  openingBalanceDate: z.coerce.date(),
  institutionName: z.string().trim().max(100).optional(),
  lastFourDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .or(z.literal(""))
    .optional(),
});

export async function createAccountAction(formData: FormData) {
  const user = await requireUser();
  const result = accountSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("The account details are invalid.");
  const input = result.data;
  const profile = await db.userProfile.findUnique({
    where: { userId: user.id },
    select: { currencyCode: true },
  });
  const profileCurrency = profile?.currencyCode ?? "INR";
  if (input.currencyCode !== profileCurrency) {
    throw new Error(
      "Account currency must match your workspace currency until exchange-rate conversion is supported.",
    );
  }
  await db.$transaction(async (tx) => {
    const account = await tx.financialAccount.create({
      data: {
        userId: user.id,
        name: input.name,
        type: input.type,
        currencyCode: input.currencyCode,
        openingBalance: input.openingBalance.toFixed(2),
        openingBalanceDate: input.openingBalanceDate,
        institutionName: input.institutionName || null,
        lastFourDigits: input.lastFourDigits || null,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        eventType: "FINANCIAL_RECORD_CHANGED",
        entityType: "FinancialAccount",
        entityId: account.id,
        action: "CREATE",
        metadata: { accountType: input.type },
      },
    });
  });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/accounts");
}
