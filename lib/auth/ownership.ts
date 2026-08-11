import { db } from "@/lib/db/client";

export class ResourceNotFoundError extends Error {
  constructor() {
    super("The requested resource was not found.");
    this.name = "ResourceNotFoundError";
  }
}

export async function requireOwnedAccount(userId: string, accountId: string) {
  const account = await db.financialAccount.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) throw new ResourceNotFoundError();
  return account;
}

export async function requireOwnedTransaction(
  userId: string,
  transactionId: string,
) {
  const transaction = await db.transaction.findFirst({
    where: { id: transactionId, userId, deletedAt: null },
  });
  if (!transaction) throw new ResourceNotFoundError();
  return transaction;
}

export async function requireOwnedCategoryOrSystemCategory(
  userId: string,
  categoryId: string,
) {
  const category = await db.category.findFirst({
    where: {
      id: categoryId,
      OR: [{ userId }, { userId: null, isSystem: true }],
    },
  });
  if (!category) throw new ResourceNotFoundError();
  return category;
}
