// MockCA.ai — Prisma CLI Configuration (Prisma 7)
// This file is used by the Prisma CLI only (migrate, generate, studio).
// The runtime client URL is configured in lib/prisma.ts via the pg adapter.

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use the direct (non-pooled) connection URL for Prisma CLI operations.
    // In Supabase this is the Session mode URL (port 5432).
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
