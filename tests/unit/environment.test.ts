import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/env";

const productionEnvironment = {
  NODE_ENV: "production",
  NEXTAUTH_URL: "https://finance.example.com",
  AUTH_SECRET: "a-secure-random-value-that-is-more-than-32-characters",
  DATABASE_URL: "postgresql://user:password@db.example.com:5432/finance",
  EMAIL_SERVER: "smtps://mailer.example.com:465",
  EMAIL_FROM: "Finance <no-reply@example.com>",
  AI_PROVIDER: "gemini",
};

describe("server environment validation", () => {
  it("accepts complete production configuration", () => {
    expect(envSchema.safeParse(productionEnvironment).success).toBe(true);
  });

  it("requires secure auth and email configuration in production", () => {
    const result = envSchema.safeParse({
      ...productionEnvironment,
      NEXTAUTH_URL: "http://finance.example.com",
      AUTH_SECRET: "replace-with-a-production-secret-value",
      EMAIL_SERVER: "",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(["NEXTAUTH_URL", "AUTH_SECRET", "EMAIL_SERVER"]),
    );
    expect(JSON.stringify(result.error.issues)).not.toContain(
      productionEnvironment.DATABASE_URL,
    );
  });
});
