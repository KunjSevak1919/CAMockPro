"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInterviewStore } from "@/lib/stores/interviewStore";

// ── Subject data ─────────────────────────────────────────

const SUBJECTS = [
  { subject: "accounting", label: "Accounting", paper: "Paper 1" },
  { subject: "law", label: "Corporate & Other Laws", paper: "Paper 2" },
  { subject: "taxation", label: "Taxation", paper: "Paper 3" },
  { subject: "cost", label: "Cost & Management", paper: "Paper 4" },
  { subject: "audit", label: "Auditing & Ethics", paper: "Paper 5" },
  { subject: "fm_sm", label: "FM & SM", paper: "Paper 6" },
];

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Expert",
};

// ── Component ─────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(3);
  const [selectedMode, setSelectedMode] = useState<"text" | "audio">("text");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step navigation ──────────────────────────────────────

  function handleNext() {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  // ── Start interview ──────────────────────────────────────

  async function handleStart() {
    if (!selectedSubject) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          difficulty: selectedDifficulty,
          mode: selectedMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create session.");
        setIsSubmitting(false);
        return;
      }

      useInterviewStore.getState().startSession(
        data.session_id,
        selectedSubject,
        selectedMode,
        selectedDifficulty,
        data.question_order,
        data.first_question
      );

      router.push(`/interview/${data.session_id}`);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  // ── Progress dots ─────────────────────────────────────────

  const steps = [1, 2, 3] as const;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-8">
      {/* Progress indicator */}
      <div className="flex justify-center gap-2">
        {steps.map((s) => (
          <span
            key={s}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              s === step ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Subject ──────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Choose a Subject
          </h1>
          <div className="grid grid-cols-2 gap-4">
            {SUBJECTS.map(({ subject, label, paper }) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`rounded-xl p-4 text-left transition-colors ${
                  selectedSubject === subject
                    ? "border-2 border-blue-500 bg-blue-50"
                    : "border border-gray-200 hover:border-blue-300 cursor-pointer"
                }`}
              >
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{paper}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Difficulty ──────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Select Difficulty
          </h1>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedDifficulty(n)}
                  aria-label={`Difficulty ${n}`}
                >
                  <Star
                    className={`h-9 w-9 transition-colors ${
                      n <= selectedDifficulty
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              {DIFFICULTY_LABELS[selectedDifficulty]}
            </p>
          </div>
        </div>
      )}

      {/* ── Step 3: Mode ────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Choose Answer Mode
          </h1>
          <div className="grid grid-cols-2 gap-4">
            {/* Text mode */}
            <button
              onClick={() => setSelectedMode("text")}
              className={`rounded-xl border-2 p-6 text-center transition-colors ${
                selectedMode === "text"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 cursor-pointer"
              }`}
            >
              <p className="text-lg font-semibold">Text</p>
              <p className="text-sm text-muted-foreground mt-1">
                Type your answers
              </p>
            </button>

            {/* Audio mode — coming soon */}
            <div className="relative rounded-xl border-2 border-gray-200 p-6 text-center opacity-50 cursor-not-allowed select-none">
              <p className="text-lg font-semibold">Audio</p>
              <p className="text-sm text-muted-foreground mt-1">
                Speak your answers
              </p>
              <Badge
                variant="secondary"
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs"
              >
                Coming Soon
              </Badge>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────── */}
      <div className="flex justify-between items-center pt-2">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
            ← Back
          </Button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={step === 1 && !selectedSubject}
          >
            Next →
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Interview
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
