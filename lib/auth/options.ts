import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { db } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const env = getEnv();
process.env.NEXTAUTH_URL ??= env.NEXTAUTH_URL;

export const authOptions = {
  adapter: PrismaAdapter(db),
  secret: env.AUTH_SECRET,
  useSecureCookies: env.NEXTAUTH_URL.startsWith("https://"),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  providers: [
    EmailProvider({
      server: env.EMAIL_SERVER ?? "smtp://localhost:1025",
      from: env.EMAIL_FROM ?? "FinPilot AI <no-reply@localhost>",
      maxAge: 15 * 60,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?sent=1",
    error: "/login",
    newUser: "/onboarding",
  },
  callbacks: {
    async signIn({ user, email }) {
      if (!email?.verificationRequest || !user.email) return true;
      const limit = await consumeRateLimit({
        scope: "auth-email-verification",
        subject: user.email.trim().toLocaleLowerCase("en-US"),
        limit: 5,
        windowMs: 15 * 60 * 1000,
      });
      return limit.allowed;
    },
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await db.userProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    },
  },
  logger: {
    error(code) {
      console.error(
        JSON.stringify({ level: "error", component: "auth", code }),
      );
    },
    warn(code) {
      console.warn(JSON.stringify({ level: "warn", component: "auth", code }));
    },
  },
} satisfies NextAuthOptions;
