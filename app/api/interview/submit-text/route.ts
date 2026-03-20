import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreAnswer } from "@/lib/ai/scoreAnswer";
import type { AIFeedback, Question } from "@/types";

export const dynamic = "force-dynamic";

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

  // Fetch the full question for AI scoring
  // Note: Prisma fields are text/expectedAnswer/keywords —
  // mapped to ScoreInput names questionText/idealAnswer/keyTerms below.
  const question = await prisma.question.findUnique({
    where: { id: question_id },
  });

  if (!question) {
    return NextResponse.json(
      { error: "Question not found." },
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

  // Run real AI scoring (falls back to defaults on any error)
  let feedback: AIFeedback;
  try {
    feedback = await scoreAnswer({
      question: {
        id: question.id,
        questionText: question.text,          // Prisma: text
        idealAnswer: question.expectedAnswer, // Prisma: expectedAnswer
        keyTerms: question.keywords,          // Prisma: keywords
        paper: question.paper,
      },
      answer_text: answer_text,
    });
  } catch (err) {
    console.error("scoreAnswer failed:", err);
    feedback = {
      score: 70,
      grade: "Good",
      strengths: ["Answer recorded successfully"],
      gaps: ["AI feedback temporarily unavailable"],
      model_answer: question.expectedAnswer,
      follow_up_question: null,
      encouragement: "Keep practising!",
      missing_concepts: [],
      similarity_score: 0,
    };
  }

  // Persist Score record using feedback values
  await prisma.score.create({
    data: {
      answerId: answer.id,
      total: feedback.score,
      accuracy: feedback.score,
      depth: feedback.score,
      terminology: feedback.score,
      feedback: feedback.encouragement,
      keyPointsCovered: feedback.missing_concepts.length > 0
        ? question.keywords.filter(
            (k) => !feedback.missing_concepts.includes(k)
          )
        : question.keywords,
      keyPointsMissed: feedback.missing_concepts,
    },
  });

  // Count answers to detect session completion
  const answeredCount = await prisma.answer.count({
    where: {
      sessionQuestion: { sessionId: session_id },
    },
  });

  const sessionComplete = answeredCount >= session.questionCount;

  if (sessionComplete) {
    await prisma.interviewSession.update({
      where: { id: session_id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        totalScore: feedback.score,
      },
    });
  }

  // Fetch next question if provided
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
    feedback,
    next_question: nextQuestion,
    session_complete: sessionComplete,
  });
}
