import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getEnv().DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

const cachedClient = globalForPrisma.prisma;
const cachedClientHasCurrentSchema =
  typeof cachedClient?.categoryEssentialityOverride?.findMany === "function";

// Next.js keeps globalThis alive across development hot reloads. Recreate a
// cached client when Prisma was regenerated with a newly added model; otherwise
// the old runtime client has no delegate for that model until the server restarts.
export const db = cachedClientHasCurrentSchema ? cachedClient : createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
