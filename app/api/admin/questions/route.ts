import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Difficulty, Paper } from "@/types";

// ── Auth helper ────────────────────────────────────────────

function checkAdminPassword(request: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const provided = request.headers.get("x-admin-password");
  return provided === adminPassword;
}

// ── GET — list all questions ───────────────────────────────

export async function GET(request: Request) {
  try {
    await getAuthUser();
  } catch (err) {
    return err as Response;
  }

  if (!checkAdminPassword(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const questions = await prisma.question.findMany({
    orderBy: [{ paper: "asc" }, { topic: "asc" }],
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

  return NextResponse.json({ questions });
}

// ── POST — create a question ───────────────────────────────

export async function POST(request: Request) {
  try {
    await getAuthUser();
  } catch (err) {
    return err as Response;
  }

  if (!checkAdminPassword(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    paper: Paper;
    topic: string;
    difficulty: Difficulty;
    text: string;
    expectedAnswer: string;
    keywords?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { paper, topic, difficulty, text, expectedAnswer, keywords = [] } =
    body;

  if (!paper || !topic || !difficulty || !text || !expectedAnswer) {
    return NextResponse.json(
      { error: "Missing required fields: paper, topic, difficulty, text, expectedAnswer." },
      { status: 400 }
    );
  }

  const question = await prisma.question.create({
    data: {
      paper,
      topic: topic.trim(),
      difficulty,
      text: text.trim(),
      expectedAnswer: expectedAnswer.trim(),
      keywords: keywords.map((k: string) => k.trim()).filter(Boolean),
    },
  });

  return NextResponse.json({ question }, { status: 201 });
}
