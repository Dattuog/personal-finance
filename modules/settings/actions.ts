"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";
import {
  currencyCodeSchema,
  localeSchema,
  timezoneSchema,
} from "@/lib/validation/localization";
import {
  expenseEssentialityValues,
  type ExpenseEssentiality,
} from "@/modules/insights/essentiality";

const settingsSchema = z.object({
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
  locale: localeSchema,
  financialMonthStartDay: z.coerce.number().int().min(1).max(28),
  aiEnabled: z.preprocess((value) => value === "on", z.boolean()),
});

export async function updateSettingsAction(formData: FormData) {
  const user = await requireUser();
  const input = settingsSchema.parse(Object.fromEntries(formData));
  const [existing, accountCount] = await Promise.all([
    db.userProfile.findUnique({
      where: { userId: user.id },
      select: { currencyCode: true, aiEnabled: true, aiConsentAt: true },
    }),
    db.financialAccount.count({ where: { userId: user.id } }),
  ]);
  if (
    accountCount > 0 &&
    input.currencyCode !== (existing?.currencyCode ?? "INR")
  ) {
    throw new Error(
      "Workspace currency cannot be changed after financial accounts exist because automatic currency conversion is not supported.",
    );
  }
  const aiConsentAt = input.aiEnabled
    ? (existing?.aiConsentAt ?? new Date())
    : null;
  await db.userProfile.upsert({
    where: { userId: user.id },
    update: {
      ...input,
      aiConsentAt,
    },
    create: {
      userId: user.id,
      ...input,
      aiConsentAt,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/insights");
}

const essentialitySchema = z.enum(expenseEssentialityValues);
const essentialityDatabaseValue = {
  essential: "ESSENTIAL",
  mostly_essential: "MOSTLY_ESSENTIAL",
  discretionary: "DISCRETIONARY",
  mixed: "MIXED",
  unknown: "UNKNOWN",
} as const;

export async function updateExpenseEssentialityAction(formData: FormData) {
  const user = await requireUser();
  const prefix = "essentiality:";
  const entries: {
    categoryId: string;
    essentiality: ExpenseEssentiality | null;
  }[] = [];
  for (const [name, rawValue] of formData.entries()) {
    if (!name.startsWith(prefix) || typeof rawValue !== "string") continue;
    const categoryId = name.slice(prefix.length);
    if (!categoryId) continue;
    if (rawValue === "default") {
      entries.push({ categoryId, essentiality: null });
      continue;
    }
    const parsed = essentialitySchema.safeParse(rawValue);
    if (parsed.success) entries.push({ categoryId, essentiality: parsed.data });
  }
  const categoryIds = [...new Set(entries.map((entry) => entry.categoryId))];
  if (categoryIds.length === 0) return;

  const accessibleCategories = await db.category.count({
    where: {
      id: { in: categoryIds },
      kind: "EXPENSE",
      isArchived: false,
      OR: [{ userId: user.id }, { userId: null, isSystem: true }],
    },
  });
  if (accessibleCategories !== categoryIds.length)
    throw new Error("One or more expense categories are unavailable.");

  await db.$transaction(async (transaction) => {
    await transaction.categoryEssentialityOverride.deleteMany({
      where: { userId: user.id, categoryId: { in: categoryIds } },
    });
    const overrides = entries.flatMap((entry) =>
      entry.essentiality
        ? [
            {
              userId: user.id,
              categoryId: entry.categoryId,
              essentiality: essentialityDatabaseValue[entry.essentiality],
            },
          ]
        : [],
    );
    if (overrides.length)
      await transaction.categoryEssentialityOverride.createMany({
        data: overrides,
      });
  });

  revalidatePath("/settings");
  revalidatePath("/insights");
}
