"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db/client";
import {
  currencyCodeSchema,
  localeSchema,
  timezoneSchema,
} from "@/lib/validation/localization";

const onboardingProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  currencyCode: currencyCodeSchema,
  locale: localeSchema,
  timezone: timezoneSchema,
});

export async function saveOnboardingProfileAction(formData: FormData) {
  const user = await requireUser();
  const input = onboardingProfileSchema.parse(Object.fromEntries(formData));
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { name: input.name } }),
    db.userProfile.upsert({
      where: { userId: user.id },
      update: {
        currencyCode: input.currencyCode,
        locale: input.locale,
        timezone: input.timezone,
      },
      create: {
        userId: user.id,
        currencyCode: input.currencyCode,
        locale: input.locale,
        timezone: input.timezone,
      },
    }),
  ]);
  redirect("/accounts");
}
