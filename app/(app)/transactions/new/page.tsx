import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { TransactionForm } from "@/components/finance/transaction-form";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";

export const metadata: Metadata = { title: "Add transaction" };

export default async function NewTransactionPage() {
  const user = await requireUser();
  const [accounts, categories, profile] = await Promise.all([
    db.financialAccount.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.category.findMany({
      where: {
        isArchived: false,
        OR: [{ userId: user.id }, { userId: null, isSystem: true }],
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, kind: true },
    }),
    db.userProfile.findUnique({
      where: { userId: user.id },
      select: { currencyCode: true },
    }),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <p className="text-sm font-semibold text-[var(--primary)]">
          Transactions
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Add transaction
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          The selected type determines how this affects income, spending, or
          wealth allocation.
        </p>
      </div>
      {accounts.length === 0 ? (
        <Card className="mt-7 p-6 text-sm text-[var(--muted-foreground)]">
          Add an account before recording transactions.{" "}
          <a
            className="font-semibold text-[var(--primary)] underline"
            href="/accounts"
          >
            Go to accounts
          </a>
          .
        </Card>
      ) : (
        <Card className="mt-7 p-5 sm:p-7">
          <TransactionForm
            accounts={accounts}
            categories={categories}
            currencyCode={profile?.currencyCode ?? "INR"}
          />
        </Card>
      )}
    </div>
  );
}
