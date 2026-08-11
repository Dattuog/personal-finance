import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const postgresUrl = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "Must be a PostgreSQL connection URL.",
  );

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_URL: z.url().default("http://localhost:3000"),
    AUTH_SECRET: z.string().min(32),
    DATABASE_URL: postgresUrl,
    EMAIL_SERVER: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    EMAIL_FROM: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    AI_PROVIDER: z.literal("gemini").default("gemini"),
    AI_MONTHLY_USER_REQUEST_LIMIT: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),
    AI_MAX_OUTPUT_TOKENS: z.coerce
      .number()
      .int()
      .min(256)
      .max(4096)
      .default(1500),
    GEMINI_API_KEY: z.preprocess(
      blankToUndefined,
      z.string().min(1).optional(),
    ),
    GEMINI_MODEL: z.preprocess(
      blankToUndefined,
      z.string().min(1).max(120).default("gemini-3.5-flash-lite"),
    ),
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV !== "production") return;

    const authUrl = new URL(environment.NEXTAUTH_URL);
    const isLocalhost = new Set(["localhost", "127.0.0.1", "::1"]).has(
      authUrl.hostname,
    );
    if (authUrl.protocol !== "https:" && !isLocalhost) {
      context.addIssue({
        code: "custom",
        path: ["NEXTAUTH_URL"],
        message: "Must use HTTPS outside localhost in production.",
      });
    }
    if (!environment.EMAIL_SERVER) {
      context.addIssue({
        code: "custom",
        path: ["EMAIL_SERVER"],
        message: "Required for passwordless login in production.",
      });
    }
    if (!environment.EMAIL_FROM) {
      context.addIssue({
        code: "custom",
        path: ["EMAIL_FROM"],
        message: "Required for passwordless login in production.",
      });
    }
    if (
      /(?:replace|placeholder|development-only|change-before|secret123)/i.test(
        environment.AUTH_SECRET,
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "Must be a securely generated production value.",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

let parsedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (parsedEnv) return parsedEnv;

  const result = envSchema.safeParse({
    ...process.env,
    // Preserve compatibility with the previous local variable while moving to
    // the canonical NextAuth v4 deployment variable.
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? undefined,
  });
  if (!result.success) {
    const fields = [
      ...new Set(
        result.error.issues.map((issue) => String(issue.path[0] ?? "unknown")),
      ),
    ].sort();
    throw new Error(
      `Invalid server configuration. Check: ${fields.join(", ")}.`,
    );
  }
  parsedEnv = result.data;
  return parsedEnv;
}
