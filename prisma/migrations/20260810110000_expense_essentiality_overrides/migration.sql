-- Let each user override an expense category's AI-analysis classification
-- without mutating shared system categories or deterministic accounting fields.
CREATE TYPE "ExpenseEssentiality" AS ENUM (
  'ESSENTIAL',
  'MOSTLY_ESSENTIAL',
  'DISCRETIONARY',
  'MIXED',
  'UNKNOWN'
);

CREATE TABLE "category_essentiality_overrides" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "essentiality" "ExpenseEssentiality" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "category_essentiality_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "category_essentiality_overrides_userId_categoryId_key"
ON "category_essentiality_overrides"("userId", "categoryId");

CREATE INDEX "category_essentiality_overrides_categoryId_idx"
ON "category_essentiality_overrides"("categoryId");

ALTER TABLE "category_essentiality_overrides"
ADD CONSTRAINT "category_essentiality_overrides_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "category_essentiality_overrides"
ADD CONSTRAINT "category_essentiality_overrides_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
