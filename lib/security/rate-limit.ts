import "server-only";

import { createHmac } from "node:crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db/client";
import { getEnv } from "@/lib/env";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const serializableRetryLimit = 3;

function isWriteConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

function subjectHash(scope: string, subject: string) {
  return createHmac("sha256", getEnv().AUTH_SECRET)
    .update(`${scope}\u0000${subject}`)
    .digest("hex");
}

export async function consumeRateLimit(input: {
  scope: string;
  subject: string;
  limit: number;
  windowMs: number;
  now?: Date;
}): Promise<RateLimitResult> {
  if (!input.scope.trim() || input.scope.length > 80)
    throw new Error("Invalid rate-limit scope.");
  if (!input.subject.trim()) throw new Error("Invalid rate-limit subject.");
  if (!Number.isSafeInteger(input.limit) || input.limit < 1)
    throw new Error("Invalid rate-limit count.");
  if (!Number.isSafeInteger(input.windowMs) || input.windowMs < 1000)
    throw new Error("Invalid rate-limit window.");

  const now = input.now ?? new Date();
  const cutoff = new Date(now.getTime() - input.windowMs);
  const hashedSubject = subjectHash(input.scope, input.subject);

  for (let attempt = 1; attempt <= serializableRetryLimit; attempt += 1) {
    try {
      return await db.$transaction(
        async (transaction) => {
          await transaction.rateLimitEvent.deleteMany({
            where: {
              scope: input.scope,
              createdAt: { lt: cutoff },
            },
          });
          const events = await transaction.rateLimitEvent.findMany({
            where: {
              scope: input.scope,
              subjectHash: hashedSubject,
              createdAt: { gte: cutoff },
            },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true },
            take: input.limit,
          });

          if (events.length >= input.limit) {
            const oldest = events[0]?.createdAt ?? now;
            return {
              allowed: false,
              remaining: 0,
              retryAfterSeconds: Math.max(
                1,
                Math.ceil(
                  (oldest.getTime() + input.windowMs - now.getTime()) / 1000,
                ),
              ),
            };
          }

          await transaction.rateLimitEvent.create({
            data: {
              scope: input.scope,
              subjectHash: hashedSubject,
              createdAt: now,
            },
          });
          return {
            allowed: true,
            remaining: input.limit - events.length - 1,
            retryAfterSeconds: 0,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isWriteConflict(error) && attempt < serializableRetryLimit) continue;
      throw error;
    }
  }

  throw new Error("Unable to enforce the request limit.");
}
