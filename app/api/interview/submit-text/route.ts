import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AIFeedback, Question } from "@/types";

// ── Mocked feedback (Week 3 placeholder — replaced by Claude in Week 5) ──

const MOCKED_FEEDBACK: AIFeedback = {
  score: 75,
  grade: "Good",
  strengths: [
    "Demonstrated understanding of core concepts",
    "Used appropriate CA terminology",
  ],
  gaps: [
    "Could elaborate more on practical application in real audit scenarios",
  ],
  model_answer:
    "A comprehensive answer covers the definition, regulatory framework under " +
    "ICAI standards, practical application, and common exceptions that a " +
    "CA Intermediate student should know.",
  follow_up_question: null,
  encouragement: "Good attempt! Your understanding of the fundamentals is solid.",
  missing_concepts: [],
  similarity_score: 0.75,
};

// ── POST /api/interview/submit-text ────────────────────────

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser();
  } catch (err) {
    return err as Response;
  }

  let body: {
    session_id: string;
    question_id: string;
    answer_text: string;
    duration_seconds?: number;
    next_question_id?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const {
    session_id,
    question_id,
    answer_text,
    next_question_id = null,
  } = body;

  if (!session_id || !question_id || !answer_text?.trim()) {
    return NextResponse.json(
      { error: "session_id, question_id, and answer_text are required." },
      { status: 400 }
    );
  }

  // Verify the session belongs to the current user
  const session = await prisma.interviewSession.findUnique({
    where: { id: session_id },
    select: { userId: true, questionCount: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (session.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Find the SessionQuestion for this session + question pair
  const sessionQuestion = await prisma.sessionQuestion.findUnique({
    where: {
      sessionId_questionId: {
        sessionId: session_id,
        questionId: question_id,
      },
    },
  });

  if (!sessionQuestion) {
    return NextResponse.json(
      { error: "Question not found in this session." },
      { status: 404 }
    );
  }

  // Create the Answer record
  const answer = await prisma.answer.create({
    data: {
      sessionQuestionId: sessionQuestion.id,
      transcription: answer_text.trim(),
    },
  });

  // Create the (mocked) Score record
  // total/accuracy/depth/terminology stored as 0–100
  await prisma.score.create({
    data: {
      answerId: answer.id,
      total: 75,
      accuracy: 80,
      depth: 70,
      terminology: 75,
      feedback: MOCKED_FEEDBACK.encouragement,
      keyPointsCovered: [],
      keyPointsMissed: [],
    },
  });

  // Count how many questions in this session now have answers
  const answeredCount = await prisma.answer.count({
    where: {
      sessionQuestion: { sessionId: session_id },
    },
  });

  const sessionComplete = answeredCount >= session.questionCount;

  // If all questions answered → complete the session
  if (sessionComplete) {
    await prisma.interviewSession.update({
      where: { id: session_id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        totalScore: 75.0,
      },
    });
  }

  // Fetch the next question if provided
  let nextQuestion: Question | null = null;
  if (next_question_id) {
    const q = await prisma.question.findUnique({
      where: { id: next_question_id },
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
    nextQuestion = q as Question | null;
  }

  return NextResponse.json({
    feedback: MOCKED_FEEDBACK,
    next_question: nextQuestion,
    session_complete: sessionComplete,
  });
}
