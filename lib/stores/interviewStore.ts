// ============================================================
// MockCA.ai — Interview Session Store (Zustand)
// Manages active interview session state client-side.
// ============================================================

import { create } from "zustand";
import type { Question, AIFeedback } from "@/types";

// ── State shape ────────────────────────────────────────────

type InterviewState = {
  sessionId: string | null;
  subject: string | null;
  mode: "text" | "audio";
  difficulty: number;           // 1–5 numeric scale
  questionOrder: string[];      // ordered array of question IDs
  currentQuestion: Question | null;
  questionIndex: number;        // 0-indexed
  totalQuestions: number;
  lastFeedback: AIFeedback | null;
  isLoadingFeedback: boolean;
};

// ── Actions ────────────────────────────────────────────────

type InterviewActions = {
  startSession: (
    sessionId: string,
    subject: string,
    mode: "text" | "audio",
    difficulty: number,
    questionOrder: string[],
    firstQuestion: Question
  ) => void;
  setFeedback: (feedback: AIFeedback) => void;
  nextQuestion: (question: Question) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
};

// ── Defaults ───────────────────────────────────────────────

const DEFAULT_STATE: InterviewState = {
  sessionId: null,
  subject: null,
  mode: "text",
  difficulty: 3,
  questionOrder: [],
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 5,
  lastFeedback: null,
  isLoadingFeedback: false,
};

// ── Store ──────────────────────────────────────────────────

export const useInterviewStore = create<InterviewState & InterviewActions>(
  (set) => ({
    ...DEFAULT_STATE,

    startSession: (
      sessionId,
      subject,
      mode,
      difficulty,
      questionOrder,
      firstQuestion
    ) =>
      set({
        sessionId,
        subject,
        mode,
        difficulty,
        questionOrder,
        currentQuestion: firstQuestion,
        questionIndex: 0,
        totalQuestions: questionOrder.length,
        lastFeedback: null,
        isLoadingFeedback: false,
      }),

    setFeedback: (feedback) =>
      set({
        lastFeedback: feedback,
        isLoadingFeedback: false,
      }),

    nextQuestion: (question) =>
      set((state) => ({
        currentQuestion: question,
        questionIndex: state.questionIndex + 1,
        lastFeedback: null,
      })),

    setLoading: (loading) => set({ isLoadingFeedback: loading }),

    reset: () => set(DEFAULT_STATE),
  })
);
