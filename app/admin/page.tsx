"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PAPER_LABELS } from "@/types";
import type { Question, Paper, Difficulty } from "@/types";

// ── Types ──────────────────────────────────────────────────

type QuestionFormData = {
  paper: Paper | "";
  topic: string;
  difficulty: Difficulty | "";
  text: string;
  expectedAnswer: string;
  keywords: string; // comma-separated raw input
};

const EMPTY_FORM: QuestionFormData = {
  paper: "",
  topic: "",
  difficulty: "",
  text: "",
  expectedAnswer: "",
  keywords: "",
};

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const DIFFICULTY_VARIANT: Record<
  Difficulty,
  "default" | "secondary" | "destructive"
> = {
  EASY: "secondary",
  MEDIUM: "default",
  HARD: "destructive",
};

// ── Page ───────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState("");

  const [form, setForm] = useState<QuestionFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);

  const loadQuestions = useCallback(async (pw: string) => {
    setLoadingQ(true);
    try {
      const res = await fetch("/api/admin/questions", {
        headers: { "x-admin-password": pw },
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions ?? []);
      }
    } finally {
      setLoadingQ(false);
    }
  }, []);

  // Verify password by hitting the GET endpoint
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/questions", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      setUnlocked(true);
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } else {
      setAuthError("Wrong password.");
    }
  }

  // Reload questions when unlocked
  useEffect(() => {
    if (unlocked) loadQuestions(password);
  }, [unlocked, loadQuestions, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.paper || !form.difficulty) return;
    setSubmitting(true);
    setSubmitMsg(null);

    const payload = {
      paper: form.paper,
      topic: form.topic.trim(),
      difficulty: form.difficulty,
      text: form.text.trim(),
      expectedAnswer: form.expectedAnswer.trim(),
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };

    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSubmitMsg({ type: "success", text: "Question created." });
      setForm(EMPTY_FORM);
      loadQuestions(password);
    } else {
      const err = await res.json().catch(() => ({}));
      setSubmitMsg({
        type: "error",
        text: err.error ?? "Failed to create question.",
      });
    }
    setSubmitting(false);
  }

  // ── Password gate ──────────────────────────

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-center">Admin</h1>
          <form onSubmit={handleUnlock} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Admin password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            {authError && (
              <p className="text-sm text-destructive">{authError}</p>
            )}
            <Button type="submit" className="w-full" disabled={!password}>
              Unlock
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin UI ───────────────────────────────

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Question Bank Admin</h1>
          <Badge variant="secondary">{questions.length} questions</Badge>
        </div>

        {/* ── Create question form ── */}
        <section>
          <h2 className="text-base font-semibold mb-4">Add Question</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Paper */}
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select
                  value={form.paper}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, paper: v as Paper }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select paper" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAPER_LABELS) as Paper[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PAPER_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g. Deferred Tax"
                  value={form.topic}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, topic: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5 w-40">
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, difficulty: v as Difficulty }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question text */}
            <div className="space-y-1.5">
              <Label htmlFor="text">Question</Label>
              <Textarea
                id="text"
                placeholder="Write the interview question here…"
                rows={3}
                value={form.text}
                onChange={(e) =>
                  setForm((f) => ({ ...f, text: e.target.value }))
                }
                required
              />
            </div>

            {/* Ideal answer */}
            <div className="space-y-1.5">
              <Label htmlFor="expectedAnswer">Ideal Answer</Label>
              <Textarea
                id="expectedAnswer"
                placeholder="Model answer Claude will use for scoring…"
                rows={5}
                value={form.expectedAnswer}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expectedAnswer: e.target.value }))
                }
                required
              />
            </div>

            {/* Key concepts */}
            <div className="space-y-1.5">
              <Label htmlFor="keywords">Key Concepts</Label>
              <Input
                id="keywords"
                placeholder="deferred tax, timing difference, DTA, DTL"
                value={form.keywords}
                onChange={(e) =>
                  setForm((f) => ({ ...f, keywords: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated. Claude checks these against the student&apos;s
                answer.
              </p>
            </div>

            {submitMsg && (
              <p
                className={
                  submitMsg.type === "success"
                    ? "text-sm text-green-600"
                    : "text-sm text-destructive"
                }
              >
                {submitMsg.text}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || !form.paper || !form.difficulty}
            >
              {submitting ? "Saving…" : "Add Question"}
            </Button>
          </form>
        </section>

        <Separator />

        {/* ── Question list ── */}
        <section>
          <h2 className="text-base font-semibold mb-4">All Questions</h2>
          {loadingQ ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions yet. Add one above.
            </p>
          ) : (
            <div className="space-y-2">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg border p-4 space-y-1 text-sm"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {PAPER_LABELS[q.paper as Paper]}
                    </Badge>
                    <Badge variant={DIFFICULTY_VARIANT[q.difficulty]}>
                      {q.difficulty}
                    </Badge>
                    <span className="text-muted-foreground">{q.topic}</span>
                  </div>
                  <p className="font-medium leading-snug">{q.text}</p>
                  {q.keywords.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Keywords: {q.keywords.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
