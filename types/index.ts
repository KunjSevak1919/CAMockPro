// ============================================================
// MockCA.ai — Shared TypeScript Types
// ALL shared types must be defined here and imported from here.
// Never define shared types inline in components or API routes.
// ============================================================

// ─────────────────────────────────────────────
// DOMAIN ENUMS
// Mirror the Prisma enums for use on the client.
// ─────────────────────────────────────────────

export type Paper =
  | "accounting"
  | "law"
  | "taxation"
  | "cost"
  | "audit"
  | "fm_sm";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type SessionStatus =
  | "SETUP"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABANDONED";

// ─────────────────────────────────────────────
// PAPER METADATA
// Human-readable labels for each paper.
// ─────────────────────────────────────────────

export const PAPER_LABELS: Record<Paper, string> = {
  accounting: "Advanced Accounting",
  law: "Corporate and Other Laws",
  taxation: "Taxation",
  cost: "Cost and Management Accounting",
  audit: "Auditing and Ethics",
  fm_sm: "Financial Management & Strategic Management",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  examLevel: string | null;
  inviteCodeUsed: string | null;
  createdAt: Date;
};

// ─────────────────────────────────────────────
// INVITE CODE
// ─────────────────────────────────────────────

export type InviteCode = {
  id: string;
  code: string;
  label: string | null;
  maxUses: number;
  useCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
};

// ─────────────────────────────────────────────
// QUESTION
// ─────────────────────────────────────────────

export type Question = {
  id: string;
  paper: Paper;
  topic: string;
  text: string;
  difficulty: Difficulty;
  expectedAnswer: string;
  keywords: string[];
  pineconeId: string | null;
  isActive: boolean;
  createdAt: Date;
};

// ─────────────────────────────────────────────
// INTERVIEW SESSION
// ─────────────────────────────────────────────

export type InterviewSession = {
  id: string;
  userId: string;
  paper: Paper;
  status: SessionStatus;
  questionCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  totalScore: number | null;
  createdAt: Date;
};

// Session with nested questions for the results page
export type SessionWithResults = InterviewSession & {
  sessionQuestions: SessionQuestionWithAnswer[];
};

// ─────────────────────────────────────────────
// SESSION QUESTION
// ─────────────────────────────────────────────

export type SessionQuestion = {
  id: string;
  sessionId: string;
  questionId: string;
  order: number;
  askedAt: Date | null;
  createdAt: Date;
};

export type SessionQuestionWithAnswer = SessionQuestion & {
  question: Question;
  answer: AnswerWithScore | null;
};

// ─────────────────────────────────────────────
// ANSWER
// ─────────────────────────────────────────────

export type Answer = {
  id: string;
  sessionQuestionId: string;
  transcription: string | null;
  audioUrl: string | null;
  submittedAt: Date;
};

export type AnswerWithScore = Answer & {
  score: Score | null;
};

// ─────────────────────────────────────────────
// SCORE
// ─────────────────────────────────────────────

export type Score = {
  id: string;
  answerId: string;
  total: number;
  accuracy: number;
  depth: number;
  terminology: number;
  feedback: string;
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  scoredAt: Date;
};

// ─────────────────────────────────────────────
// AI MODULE TYPES
// Input/output contracts for lib/ai/ modules.
// ─────────────────────────────────────────────

/** Input to lib/ai/scoreAnswer.ts */
export type ScoreAnswerInput = {
  questionText: string;
  expectedAnswer: string;
  keywords: string[];
  transcription: string;
  paper: Paper;
};

/** Output from lib/ai/scoreAnswer.ts (mirrors Score fields) */
export type ScoreAnswerOutput = {
  total: number;
  accuracy: number;
  depth: number;
  terminology: number;
  feedback: string;
  keyPointsCovered: string[];
  keyPointsMissed: string[];
};

/** Pinecone query result from lib/ai/pinecone.ts */
export type PineconeMatch = {
  id: string;
  score: number;
  questionId: string;
  paper: Paper;
  topic: string;
  difficulty: Difficulty;
};

// ─────────────────────────────────────────────
// AI FEEDBACK
// Returned by /api/interview/submit-text and
// /api/interview/submit-audio. Held in the
// interview store as lastFeedback.
// ─────────────────────────────────────────────

export type AIFeedback = {
  score: number;                  // 0–100 overall
  grade: string;                  // e.g. "Good", "Excellent", "Needs Work"
  strengths: string[];
  gaps: string[];
  model_answer: string;
  follow_up_question: string | null;
  encouragement: string;
  missing_concepts: string[];
  similarity_score: number;       // 0–1 semantic similarity
};

// ─────────────────────────────────────────────
// API RESPONSE SHAPES
// ─────────────────────────────────────────────

export type ApiSuccess<T> = {
  data: T;
  error: null;
};

export type ApiError = {
  data: null;
  error: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────
// INTERVIEW STORE (Zustand)
// Client-side state for an active session.
// ─────────────────────────────────────────────

export type InterviewPhase =
  | "idle"
  | "loading_question"
  | "playing_question"   // TTS playing
  | "recording"          // mic open, student answering
  | "processing"         // STT + scoring in flight
  | "showing_result"     // score shown before next question
  | "completed";

export type ActiveSessionQuestion = {
  sessionQuestionId: string;
  order: number;
  question: Question;
  transcription: string | null;
  score: Score | null;
};

// ─────────────────────────────────────────────
// INTERVIEW SETUP FORM
// ─────────────────────────────────────────────

export type InterviewSetupForm = {
  paper: Paper;
  questionCount: number;
  difficulty: Difficulty | "MIXED";
};
