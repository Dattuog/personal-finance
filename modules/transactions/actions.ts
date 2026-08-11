"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/require-user";
import type { TransactionActionState } from "./action-state";
import { transactionInputSchema } from "./schema";

const nullableField = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value : null;
};

export async function createTransactionAction(
  _previous: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requireUser();
  const result = transactionInputSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    currencyCode: formData.get("currencyCode") || "INR",
    transactionDate: formData.get("transactionDate"),
    sourceAccountId: nullableField(formData, "sourceAccountId"),
    destinationAccountId: nullableField(formData, "destinationAccountId"),
    categoryId: nullableField(formData, "categoryId"),
    parentTransactionId: nullableField(formData, "parentTransactionId"),
    merchant: nullableField(formData, "merchant"),
    description: nullableField(formData, "description"),
    notes: nullableField(formData, "notes"),
    status: formData.get("status") || "CLEARED",
  });

  if (!result.success) {
    const flattened = result.error.flatten();
    return {
      error: "Review the highlighted fields and try again.",
      fieldErrors: flattened.fieldErrors,
    };
  }

  const input = result.data;
  const accountIds = [
    ...new Set(
      [input.sourceAccountId, input.destinationAccountId].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];
  const ownedAccounts = await db.financialAccount.findMany({
    where: { userId: user.id, id: { in: accountIds }, isArchived: false },
    select: { id: true, type: true, currencyCode: true },
  });
  if (ownedAccounts.length !== accountIds.length)
    return {
      error: "One of the selected accounts is unavailable.",
      fieldErrors: {},
    };
  if (
    ownedAccounts.some((account) => account.currencyCode !== input.currencyCode)
  )
    return {
      error:
        "Transaction currency must match every selected account. Currency conversion is not supported yet.",
      fieldErrors: { currencyCode: ["Use the account currency."] },
    };
  if (input.type === "INVESTMENT") {
    const destination = ownedAccounts.find(
      (account) => account.id === input.destinationAccountId,
    );
    if (destination?.type !== "INVESTMENT")
      return {
        error: "Investment contributions must go to an investment account.",
        fieldErrors: {
          destinationAccountId: ["Choose an investment account."],
        },
      };
  }

  if (input.categoryId) {
    const category = await db.category.findFirst({
      where: {
        id: input.categoryId,
        isArchived: false,
        OR: [{ userId: user.id }, { userId: null, isSystem: true }],
      },
    });
    const expectedKind =
      input.type === "INCOME"
        ? "INCOME"
        : input.type === "INVESTMENT"
          ? "INVESTMENT"
          : "EXPENSE";
    if (!category || category.kind !== expectedKind)
      return {
        error: "The selected category does not match this transaction type.",
        fieldErrors: { categoryId: ["Choose a matching category."] },
      };
  }

  if (input.parentTransactionId) {
    const parent = await db.transaction.findFirst({
      where: {
        id: input.parentTransactionId,
        userId: user.id,
        deletedAt: null,
      },
    });
    if (!parent || parent.type !== "EXPENSE")
      return {
        error: "The original expense could not be found.",
        fieldErrors: {
          parentTransactionId: ["Choose one of your own expenses."],
        },
      };
  }

  await db.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId: user.id,
        type: input.type,
        amount: input.amount.toFixed(2),
        currencyCode: input.currencyCode,
        transactionDate: input.transactionDate,
        sourceAccountId: input.sourceAccountId ?? null,
        destinationAccountId: input.destinationAccountId ?? null,
        categoryId: input.categoryId ?? null,
        parentTransactionId: input.parentTransactionId ?? null,
        merchant: input.merchant ?? null,
        description: input.description ?? null,
        notes: input.notes ?? null,
        status: input.status,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        eventType: "FINANCIAL_RECORD_CHANGED",
        entityType: "Transaction",
        entityId: transaction.id,
        action: "CREATE",
        metadata: { transactionType: input.type },
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  redirect("/transactions");
}
