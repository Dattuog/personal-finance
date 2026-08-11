import Decimal from "decimal.js";
import { db } from "@/lib/db/client";
import { getMonthRange } from "@/lib/dates/month-boundary";
import { calculateFinancialSummary } from "@/modules/analytics/calculate-summary";

export async function getDashboardData(userId: string, instant = new Date()) {
  const profile = await db.userProfile.findUnique({ where: { userId } });
  const timezone = profile?.timezone ?? "Asia/Kolkata";
  const { start, end } = getMonthRange(
    instant,
    timezone,
    profile?.financialMonthStartDay ?? 1,
  );

  const [transactions, budgets, accounts, goals, subscriptions] =
    await Promise.all([
      db.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          transactionDate: { gte: start, lte: end },
        },
        include: { category: true },
        orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      }),
      db.budget.findMany({
        where: {
          userId,
          isActive: true,
          startDate: { lte: end },
          OR: [{ endDate: null }, { endDate: { gte: start } }],
        },
        include: { category: true },
      }),
      db.financialAccount.findMany({ where: { userId, isArchived: false } }),
      db.goal.findMany({
        where: { userId, status: "ACTIVE" },
        orderBy: { priority: "desc" },
        take: 3,
      }),
      db.subscription.findMany({
        where: {
          userId,
          status: { in: ["ACTIVE", "TRIAL"] },
          nextRenewalDate: { gte: start },
        },
        orderBy: { nextRenewalDate: "asc" },
        take: 4,
      }),
    ]);

  const summary = calculateFinancialSummary(
    transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toString(),
      date: transaction.transactionDate,
      deletedAt: transaction.deletedAt,
      status: transaction.status,
      categorySlug: transaction.category?.slug ?? null,
      necessity: transaction.category?.necessity ?? null,
      costBehaviour: transaction.category?.costBehaviour ?? null,
      isKnownRecurring: transaction.isRecurringGenerated,
    })),
  );

  const budgetAmount = budgets.reduce(
    (total, budget) => total.plus(budget.amount.toString()),
    new Decimal(0),
  );
  const budgetRemaining = Decimal.max(
    budgetAmount.minus(summary.netExpenses),
    0,
  );

  return {
    timezone,
    currencyCode: profile?.currencyCode ?? "INR",
    range: { start, end },
    summary,
    budgets,
    budgetAmount,
    budgetRemaining,
    accounts,
    goals,
    subscriptions,
    recentTransactions: transactions.slice(0, 6),
  };
}
