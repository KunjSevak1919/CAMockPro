// ============================================================
// MockCA.ai — Embed All Questions into Pinecone
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}'
//      scripts/embedAllQuestions.ts
// ============================================================

// dotenv MUST be first — loads .env before any client is initialised
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Safety checks — fail fast if required vars are missing
if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY not set in .env");
}
if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error("PINECONE_INDEX_NAME not set in .env");
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY not set in .env");
}

import { prisma } from "../lib/prisma";
import { embed } from "../lib/ai/openai";
import { getIndex } from "../lib/ai/pinecone";

async function main() {
  try {
    const questions = await prisma.question.findMany({
      where: { pineconeId: null, isActive: true },
    });

    console.log(`Found ${questions.length} questions to embed`);

    let done = 0;
    for (const question of questions) {
      const vector = await embed(question.expectedAnswer);

      await getIndex().upsert({
        records: [
          {
            id: question.id,
            values: vector,
            metadata: {
              subject: question.paper,
              difficulty: question.difficulty,
              keyTerms: question.keywords,
            },
          },
        ],
      });

      await prisma.question.update({
        where: { id: question.id },
        data: { pineconeId: question.id },
      });

      console.log("✓ Embedded:", question.topic);
      done++;

      // Rate-limit: avoid hammering OpenAI
      await new Promise((r) => setTimeout(r, 300));
    }

    console.log(`Done. ${done} questions embedded.`);
  } catch (err) {
    console.error("embedAllQuestions failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
