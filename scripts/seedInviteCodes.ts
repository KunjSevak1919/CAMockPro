/**
 * MockCA.ai — Seed Invite Codes
 * Generates 10 single-use beta invite codes and inserts them into Supabase.
 * Run: npx tsx scripts/seedInviteCodes.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I

function randomPart(length: number): string {
  return Array.from(
    { length },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

function generateCode(): string {
  return `MOCKCA-BETA-${randomPart(4)}`;
}

async function main() {
  const codes = Array.from({ length: 10 }, () => ({
    code: generateCode(),
    label: "Beta Invite — Wave 1",
    maxUses: 1,
    useCount: 0,
    isActive: true,
  }));

  // Deduplicate in case of (extremely unlikely) collision
  const unique = Array.from(new Map(codes.map((c) => [c.code, c])).values());

  const result = await prisma.inviteCode.createMany({
    data: unique,
    skipDuplicates: true,
  });

  console.log(`\n✅ Inserted ${result.count} invite codes:\n`);

  const inserted = await prisma.inviteCode.findMany({
    where: { label: "Beta Invite — Wave 1" },
    select: { code: true, maxUses: true, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  inserted.forEach((c) => {
    console.log(`  ${c.code}   (maxUses: ${c.maxUses}, active: ${c.isActive})`);
  });

  console.log("");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
