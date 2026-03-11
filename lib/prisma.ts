// ============================================================
// MockCA.ai — Prisma Client Singleton (Prisma 7 + pg adapter)
// All DB queries must go through this client. Never use raw SQL.
// Uses @prisma/adapter-pg so DATABASE_URL stays in the runtime env,
// not in schema.prisma (Prisma 7 requirement).
// ============================================================

import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
