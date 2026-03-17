import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Paper, Difficulty } from "@/types";

// ── Helpers ────────────────────────────────────────────────

const VALID_PAPERS: Paper[] = [
  "accounting",
  "law",
  "taxation",
  "cost",
  "audit",
  "fm_sm",
];

function mapDifficulty(n: number): Difficulty {
  if (n <= 2) return "EASY";
  if (n === 3) return "MEDIUM";
  return "HARD";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── POST /api/sessions/create ──────────────────────────────

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser();
  } catch (err) {
    return err as Response;
  }

  let body: { subject: string; difficulty: number; mode: "text" | "audio" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { subject, difficulty, mode } = body;

  // Validate subject is a known paper
  if (!VALID_PAPERS.includes(subject as Paper)) {
    return NextResponse.json(
      { error: `Invalid subject. Must be one of: ${VALID_PAPERS.join(", ")}.` },
      { status: 400 }
    );
  }

  const paper = subject as Paper;
  const mappedDifficulty = mapDifficulty(difficulty ?? 3);

  // Fetch matching questions
  const questions = await prisma.question.findMany({
    where: {
      paper,
      difficulty: mappedDifficulty,
      isActive: true,
    },
    select: {
      id: true,
      paper: true,
      topic: true,
      text: true,
      difficulty: true,
      expectedAnswer: true,
      keywords: true,
      pineconeId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No questions available for this subject and difficulty." },
      { status: 400 }
    );
  }

  // Shuffle and take up to 5
  const selected = shuffle(questions).slice(0, 5);

  // Create the session
  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      paper,
      status: "IN_PROGRESS",
      questionCount: selected.length,
      startedAt: new Date(),
    },
  });

  // Create session question records (1-indexed order)
  await prisma.sessionQuestion.createMany({
    data: selected.map((q, i) => ({
      sessionId: session.id,
      questionId: q.id,
      order: i + 1,
    })),
  });

  return NextResponse.json(
    {
      session_id: session.id,
      first_question: selected[0],
      question_order: selected.map((q) => q.id),
    },
    { status: 201 }
  );
}
