-- Database-backed throttling prevents authentication and AI limits from being
-- bypassed when the application runs on more than one server instance.
CREATE TABLE "rate_limit_events" (
    "id" TEXT NOT NULL,
    "scope" VARCHAR(80) NOT NULL,
    "subjectHash" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rate_limit_events_scope_subjectHash_createdAt_idx"
ON "rate_limit_events"("scope", "subjectHash", "createdAt");

CREATE INDEX "rate_limit_events_createdAt_idx"
ON "rate_limit_events"("createdAt");

-- Defense-in-depth for active financial write paths. Application validation
-- provides friendly errors; these constraints prevent invalid direct writes.
ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_financial_month_start_check"
CHECK ("financialMonthStartDay" BETWEEN 1 AND 28);

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_amount_positive_check"
CHECK ("amount" > 0);

ALTER TABLE "budgets"
ADD CONSTRAINT "budgets_amount_positive_check"
CHECK ("amount" > 0),
ADD CONSTRAINT "budgets_threshold_range_check"
CHECK ("alertThresholdPercent" BETWEEN 0 AND 100),
ADD CONSTRAINT "budgets_date_order_check"
CHECK ("endDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_amount_positive_check"
CHECK ("amount" > 0);

ALTER TABLE "goals"
ADD CONSTRAINT "goals_amounts_check"
CHECK ("targetAmount" > 0 AND "currentAmount" >= 0);
