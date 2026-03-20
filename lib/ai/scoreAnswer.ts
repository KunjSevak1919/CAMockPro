// ============================================================
// MockCA.ai — Answer Scoring via Claude (claude-sonnet-4-6)
// All Claude API calls must go through this module only.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { embed } from "./openai";
import { getIndex } from "./pinecone";
import { cosineSimilarity } from "./similarity";
import type { AIFeedback } from "@/types";

// ── System prompt ─────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a senior Chartered Accountant with 15 years of Big4 experience conducting mock interviews for CA Intermediate students preparing for articleship.

You receive JSON with:
- question: the interview question asked
- student_answer: what the student wrote
- similarity_score: float 0-1 semantic overlap with ideal answer
- missing_concepts: key terms student did not cover
- subject: CA paper subject

SCORING GUIDE:
similarity >= 0.85 → score 85-100, Excellent
similarity 0.70-0.84 → score 70-84, Good
similarity 0.55-0.69 → score 55-69, Average
similarity < 0.55 → score 30-54, Needs Work
Adjust within range based on reasoning quality.

FEEDBACK RULES:
1. Reference specific phrases from student answer
2. For each gap explain WHY it matters for CA Inter
3. model_answer: how a top CA student would answer
4. follow_up_question: if score below 65, else null
5. encouragement: mention something specific they got right

Return ONLY this JSON, no other text, no markdown:
{
  "score": <integer 0-100>,
  "grade": "<Excellent|Good|Average|Needs Work>",
  "strengths": ["specific point from their answer"],
  "gaps": ["what they missed and why it matters"],
  "model_answer": "<3-4 sentence ideal answer>",
  "follow_up_question": "<probing question or null>",
  "encouragement": "<one specific sentence>"
}
`;

// ── Input shape ───────────────────────────────────────────

interface ScoreInput {
  question: {
    id: string;
    questionText: string;
    idealAnswer: string;
    keyTerms: string[];
    paper: string;
  };
  answer_text: string;
}

// ── Pipeline ──────────────────────────────────────────────

export async function scoreAnswer(input: ScoreInput): Promise<AIFeedback> {
  // Step 1: Sanitise
  const clean = input.answer_text.trim().slice(0, 2000);
  if (clean.length < 5) {
    throw new Error("Answer too short to score");
  }

  // Step 2: Parallel embed + fetch ideal vector from Pinecone
  const [answerVector, pineconeResult] = await Promise.all([
    embed(clean),
    getIndex().fetch({ ids: [input.question.id] }),
  ]);

  // Step 3: Retrieve ideal vector
  const idealVector = pineconeResult.records[input.question.id]?.values;
  if (!idealVector) {
    throw new Error(
      "Question not embedded in Pinecone: " + input.question.id
    );
  }

  // Step 4: Cosine similarity
  const similarity = cosineSimilarity(answerVector, idealVector);

  // Step 5: Find missing concepts
  const answerLower = clean.toLowerCase();
  const missingConcepts = input.question.keyTerms.filter(
    (term) => !answerLower.includes(term.toLowerCase())
  );

  // Step 6: Call Claude with 15-second timeout
  const claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const msg = await Promise.race([
    claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            question: input.question.questionText,
            student_answer: clean,
            similarity_score: similarity,
            missing_concepts: missingConcepts,
            subject: input.question.paper,
          }),
        },
      ],
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Claude timeout after 15s")), 15000)
    ),
  ]);

  // Step 7: Parse JSON response safely
  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Claude returned no JSON");
  }
  const feedback = JSON.parse(match[0]) as AIFeedback;

  // Step 8: Attach computed values and return
  feedback.similarity_score = similarity;
  feedback.missing_concepts = missingConcepts;

  console.log("scoreAnswer:", {
    question_id: input.question.id,
    similarity: similarity.toFixed(3),
    score: feedback.score,
  });

  return feedback;
}
