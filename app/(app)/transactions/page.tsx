import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";
import { formatMoney } from "@/lib/money/decimal";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { z } from "zod";

export const metadata: Metadata = { title: "Transactions" };
const pageSize = 25;
const transactionSearchSchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  q: z.string().trim().max(120).catch(""),
});

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const user = await requireUser();
  const params = transactionSearchSchema.parse(await searchParams);
  const page = params.page;
  const query = params.q;
  const where = {
    userId: user.id,
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { merchant: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [transactions, total, profile] = await Promise.all([
    db.transaction.findMany({
      where,
      include: {
        category: true,
        sourceAccount: true,
        destinationAccount: true,
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.transaction.count({ where }),
    db.userProfile.findUnique({
      where: { userId: user.id },
      select: { currencyCode: true },
    }),
  ]);
  const currency = profile?.currencyCode ?? "INR";
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">Ledger</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Transactions
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            {total} active record{total === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/transactions/new"
          className={buttonVariants({ variant: "primary" })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add transaction
        </Link>
      </div>
      <Card className="mt-7 overflow-hidden">
        <form className="border-b border-[var(--border)] p-4">
          <label className="relative block max-w-md">
            <span className="sr-only">Search transactions</span>
            <Search
              className="absolute top-3.5 left-3 size-4 text-[var(--muted-foreground)]"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search merchant or description"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pr-3 pl-10 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
        </form>
        {transactions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[var(--background)] text-xs tracking-wide text-[var(--muted-foreground)] uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Account impact</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-[var(--background)]"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-[var(--muted-foreground)]">
                      {format(transaction.transactionDate, "dd MMM yyyy")}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {transaction.merchant ||
                          transaction.description ||
                          "Untitled transaction"}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {transaction.category?.name ?? "No category"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-semibold">
                        {transaction.type.toLocaleLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--muted-foreground)]">
                      {transaction.sourceAccount?.name ?? "—"}
                      {transaction.destinationAccount
                        ? ` → ${transaction.destinationAccount.name}`
                        : ""}
                    </td>
                    <td className="px-5 py-4 text-right font-bold tabular-nums">
                      {transaction.type === "INCOME" ||
                      transaction.type === "REFUND"
                        ? "+"
                        : "−"}
                      {formatMoney(transaction.amount.toString(), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <p className="font-semibold">No matching transactions</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Add a record or change your search.
            </p>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-4 text-sm">
          <p className="text-[var(--muted-foreground)]">
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                href={`/transactions?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              >
                Previous
              </Link>
            )}
            {page * pageSize < total && (
              <Link
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                href={`/transactions?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
