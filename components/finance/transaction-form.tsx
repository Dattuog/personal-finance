"use client";

import {
  cloneElement,
  isValidElement,
  useActionState,
  useId,
  useState,
} from "react";
import { createTransactionAction } from "@/modules/transactions/actions";
import { initialTransactionActionState } from "@/modules/transactions/action-state";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  name: string;
  kind?: "INCOME" | "EXPENSE" | "INVESTMENT";
}

export function TransactionForm({
  accounts,
  categories,
  currencyCode,
}: {
  accounts: readonly Option[];
  categories: readonly Option[];
  currencyCode: string;
}) {
  const [type, setType] = useState("EXPENSE");
  const [state, action, pending] = useActionState(
    createTransactionAction,
    initialTransactionActionState,
  );
  const formError = state?.error ?? null;
  const fieldErrors = state?.fieldErrors ?? {};
  const filteredCategories = categories.filter(
    (category) =>
      category.kind ===
      (type === "INCOME"
        ? "INCOME"
        : type === "INVESTMENT"
          ? "INVESTMENT"
          : "EXPENSE"),
  );
  const showSource = [
    "EXPENSE",
    "TRANSFER",
    "INVESTMENT",
    "ADJUSTMENT",
  ].includes(type);
  const showDestination = [
    "INCOME",
    "TRANSFER",
    "INVESTMENT",
    "REFUND",
    "ADJUSTMENT",
  ].includes(type);
  const fieldClass =
    "h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/20";

  return (
    <form action={action} className="space-y-6">
      {formError && (
        <p
          role="alert"
          className="rounded-xl bg-[var(--destructive-soft)] p-4 text-sm text-[var(--destructive)]"
        >
          {formError}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Transaction type" error={fieldErrors.type?.[0]}>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={fieldClass}
          >
            {[
              "INCOME",
              "EXPENSE",
              "TRANSFER",
              "INVESTMENT",
              "REFUND",
              "ADJUSTMENT",
            ].map((value) => (
              <option key={value} value={value}>
                {value.toLocaleLowerCase().replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={`Amount (${currencyCode})`}
          error={fieldErrors.amount?.[0]}
        >
          <input
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            required
            placeholder="0.00"
            className={fieldClass}
          />
        </Field>
        <input type="hidden" name="currencyCode" value={currencyCode} />
        <Field label="Date" error={fieldErrors.transactionDate?.[0]}>
          <input
            name="transactionDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={fieldClass}
          />
        </Field>
        <Field label="Status" error={fieldErrors.status?.[0]}>
          <select name="status" defaultValue="CLEARED" className={fieldClass}>
            <option value="CLEARED">Cleared</option>
            <option value="PENDING">Pending</option>
            <option value="RECONCILED">Reconciled</option>
          </select>
        </Field>
        {showSource && (
          <Field
            label="Source account"
            error={fieldErrors.sourceAccountId?.[0]}
          >
            <select name="sourceAccountId" className={fieldClass}>
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {showDestination && (
          <Field
            label="Destination account"
            error={fieldErrors.destinationAccountId?.[0]}
          >
            <select name="destinationAccountId" className={fieldClass}>
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {type !== "TRANSFER" && type !== "ADJUSTMENT" && (
          <Field label="Category" error={fieldErrors.categoryId?.[0]}>
            <select name="categoryId" className={fieldClass}>
              <option value="">Select a category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Merchant or source" error={fieldErrors.merchant?.[0]}>
          <input
            name="merchant"
            maxLength={120}
            placeholder="Optional"
            className={fieldClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" error={fieldErrors.description?.[0]}>
            <input
              name="description"
              maxLength={240}
              placeholder="What was this for?"
              className={fieldClass}
            />
          </Field>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <a
          href="/transactions"
          className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
        >
          Cancel
        </a>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save transaction"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        id: children.props.id ?? generatedId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })
    : children;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {control}
      {error && (
        <span
          id={errorId}
          role="alert"
          className="mt-1.5 block text-xs text-[var(--destructive)]"
        >
          {error}
        </span>
      )}
    </label>
  );
}
