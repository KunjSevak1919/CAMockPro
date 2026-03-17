"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useInterviewStore } from "@/lib/stores/interviewStore";
import Timer from "@/components/interview/Timer";
import QuestionCard from "@/components/interview/QuestionCard";
import FeedbackCard from "@/components/interview/FeedbackCard";
import { PAPER_LABELS } from "@/types";
import type { Question } from "@/types";

// ── Subject badge colors ──────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
  accounting: "bg-blue-100 text-blue-700",
  law: "bg-purple-100 text-purple-700",
  taxation: "bg-green-100 text-green-700",
  cost: "bg-orange-100 text-orange-700",
  audit: "bg-red-100 text-red-700",
  fm_sm: "bg-teal-100 text-teal-700",
};

// ── Component ─────────────────────────────────────────────

export default function SessionPage() {
  const router = useRouter();

  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    lastFeedback,
    isLoadingFeedback,
    sessionId,
    subject,
    questionOrder,
  } = useInterviewStore();

  const [answerText, setAnswerText] = useState("");
  const [timerKey, setTimerKey] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [nextQuestionData, setNextQuestionData] = useState<Question | null>(
    null
  );

  // Redirect on page refresh (store is empty)
  useEffect(() => {
    if (!currentQuestion) {
      router.replace("/interview/setup");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentQuestion) return null;

  // ── Submit answer ────────────────────────────────────────

  async function handleSubmit(overrideText?: string) {
    const text = overrideText ?? answerText;
    if (!text.trim() || !currentQuestion) return;

    useInterviewStore.getState().setLoading(true);

    const nextQuestionId = questionOrder[questionIndex + 1] ?? null;

    try {
      const res = await fetch("/api/interview/submit-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: currentQuestion.id,
          answer_text: text,
          duration_seconds: 120,
          next_question_id: nextQuestionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        useInterviewStore.getState().setLoading(false);
        return;
      }

      useInterviewStore.getState().setFeedback(data.feedback);
      setSessionComplete(data.session_complete);
      setNextQuestionData(data.next_question ?? null);
    } catch {
      useInterviewStore.getState().setLoading(false);
    }
  }

  // ── Next question ────────────────────────────────────────

  function handleNextQuestion() {
    if (nextQuestionData) {
      useInterviewStore.getState().nextQuestion(nextQuestionData);
      setAnswerText("");
      setTimerKey((prev) => prev + 1);
      setNextQuestionData(null);
      setSessionComplete(false);
    } else {
      router.push(`/interview/results/${sessionId}`);
    }
  }

  // ── Timer expire ─────────────────────────────────────────

  function handleTimerExpire() {
    if (answerText.trim()) {
      handleSubmit();
    } else {
      handleSubmit("No answer provided");
    }
  }

  // ── Derived ──────────────────────────────────────────────

  const subjectLabel =
    subject && PAPER_LABELS[subject as keyof typeof PAPER_LABELS]
      ? PAPER_LABELS[subject as keyof typeof PAPER_LABELS]
      : subject ?? "Interview";

  const subjectColorClass =
    subject && SUBJECT_COLORS[subject]
      ? SUBJECT_COLORS[subject]
      : "bg-gray-100 text-gray-700";

  const progress = ((questionIndex) / totalQuestions) * 100;
  const charOverLimit = answerText.length > 400;

  return (
    <div className="flex gap-6 p-6 min-h-screen">
      {/* ── Left panel ──────────────────────────────────── */}
      <div className="w-64 shrink-0">
        <Card className="sticky top-6">
          <CardHeader className="pb-3">
            <span
              className={`inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${subjectColorClass}`}
            >
              {subjectLabel}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {questionIndex + 1}
              </p>
              <p className="text-sm text-muted-foreground">
                of {totalQuestions}
              </p>
            </div>

            <Timer
              key={timerKey}
              initialSeconds={120}
              onExpire={handleTimerExpire}
            />

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Progress</p>
              <Progress value={progress} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Right panel ─────────────────────────────────── */}
      <div className="flex-1 space-y-4">
        <QuestionCard
          question={currentQuestion}
          questionNumber={questionIndex + 1}
          totalQuestions={totalQuestions}
        />

        {/* Answer area — hide after feedback */}
        {lastFeedback === null && (
          <div className="space-y-2">
            <Textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              maxLength={500}
              placeholder="Type your answer here..."
              className="min-h-[150px] w-full resize-y"
              disabled={isLoadingFeedback}
            />
            <div className="flex items-center justify-between">
              <span />
              <span
                className={`text-xs tabular-nums ${
                  charOverLimit ? "text-red-500 font-medium" : "text-muted-foreground"
                }`}
              >
                {answerText.length} / 500
              </span>
            </div>
            <Button
              className="w-full gap-2"
              disabled={!answerText.trim() || isLoadingFeedback}
              onClick={() => handleSubmit()}
            >
              {isLoadingFeedback ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing your answer…
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
          </div>
        )}

        {/* Feedback */}
        <FeedbackCard
          feedback={lastFeedback!}
          visible={lastFeedback !== null}
        />

        {/* Post-feedback navigation */}
        {lastFeedback !== null && (
          <div className="pt-2">
            {!sessionComplete ? (
              <Button className="w-full" onClick={handleNextQuestion}>
                Next Question →
              </Button>
            ) : (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() =>
                  router.push(`/interview/results/${sessionId}`)
                }
              >
                View Your Results
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
