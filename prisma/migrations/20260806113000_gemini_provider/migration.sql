-- Add provider-neutral AI tracking without rewriting or deleting historical reports.
ALTER TABLE "insight_reports"
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'legacy',
ADD COLUMN "errorCode" TEXT;

ALTER TABLE "insight_reports"
ALTER COLUMN "provider" SET DEFAULT 'gemini';

DROP INDEX "insight_reports_userId_reportType_periodStart_periodEnd_ana_key";

CREATE UNIQUE INDEX "insight_reports_identity_provider_model_key"
ON "insight_reports"(
  "userId",
  "reportType",
  "periodStart",
  "periodEnd",
  "analyticsVersion",
  "promptVersion",
  "inputHash",
  "provider",
  "model"
);
