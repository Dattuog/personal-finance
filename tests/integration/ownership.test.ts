import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import {
  requireOwnedAccount,
  requireOwnedTransaction,
  ResourceNotFoundError,
} from "@/lib/auth/ownership";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const testEmails = [
  "integration-owner-a@finpilot.local",
  "integration-owner-b@finpilot.local",
] as const;

describe("database ownership boundaries", () => {
  let ownerA = "";
  let ownerB = "";
  let accountA = "";
  let transactionA = "";

  beforeAll(async () => {
    await db.user.deleteMany({ where: { email: { in: [...testEmails] } } });
    const first = await db.user.create({
      data: {
        email: testEmails[0],
        profile: { create: {} },
        financialAccounts: {
          create: {
            name: "Owner A bank",
            type: "BANK",
            openingBalance: "1000",
            openingBalanceDate: new Date("2026-08-01"),
          },
        },
      },
      include: { financialAccounts: true },
    });
    const second = await db.user.create({
      data: { email: testEmails[1], profile: { create: {} } },
    });
    ownerA = first.id;
    ownerB = second.id;
    accountA = first.financialAccounts[0]?.id ?? "";
    const transaction = await db.transaction.create({
      data: {
        userId: ownerA,
        type: "EXPENSE",
        amount: "25.00",
        transactionDate: new Date("2026-08-02"),
        sourceAccountId: accountA,
      },
    });
    transactionA = transaction.id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { in: [...testEmails] } } });
    await db.$disconnect();
  });

  it("returns a resource only to its owner", async () => {
    await expect(requireOwnedAccount(ownerA, accountA)).resolves.toMatchObject({
      id: accountA,
      userId: ownerA,
    });
  });

  it("uses the same not-found response across user boundaries", async () => {
    await expect(requireOwnedAccount(ownerB, accountA)).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
    await expect(
      requireOwnedTransaction(ownerB, transactionA),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("enforces a database-backed request limit without storing raw subjects", async () => {
    const scope = `integration-${crypto.randomUUID()}`;
    const subject = "sensitive-user-identifier";
    await expect(
      consumeRateLimit({ scope, subject, limit: 2, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: true, remaining: 1 });
    await expect(
      consumeRateLimit({ scope, subject, limit: 2, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(
      consumeRateLimit({ scope, subject, limit: 2, windowMs: 60_000 }),
    ).resolves.toMatchObject({ allowed: false, remaining: 0 });

    const stored = await db.rateLimitEvent.findMany({ where: { scope } });
    expect(stored).toHaveLength(2);
    expect(stored.every((event) => event.subjectHash !== subject)).toBe(true);
    await db.rateLimitEvent.deleteMany({ where: { scope } });
  });

  it("rolls back a failed multi-record financial change", async () => {
    const marker = "rollback-verification";
    await expect(
      db.$transaction(async (transaction) => {
        await transaction.auditLog.create({
          data: {
            userId: ownerA,
            eventType: marker,
            entityType: "Test",
            action: "CREATE",
          },
        });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    await expect(
      db.auditLog.count({ where: { userId: ownerA, eventType: marker } }),
    ).resolves.toBe(0);
  });
});
