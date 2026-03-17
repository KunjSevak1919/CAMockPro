import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { prisma } from "@/lib/prisma";
import { PAPER_LABELS } from "@/types";
import type { Paper } from "@/types";
import ScoreRing from "@/components/interview/ScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────

function gradeFromScore(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Average";
  return "Needs Work";
}

function gradeBadgeVariant(
  grade: string
): "default" | "secondary" | "destructive" | "outline" {
  if (grade === "Excellent" || grade === "Good") return "default";
  if (grade === "Average") return "secondary";
  return "destructive";
}

function scoreBadgeVariant(
  score: number
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 75) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return "—";
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  return `${mins} min`;
}

// ── Page ──────────────────────────────────────────────────

export default async function ResultsPage({
  params,
}: {
  params: { sessionId: string };
}) {
  // Auth check
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login");

  // Fetch session with all nested data
  const interviewSession = await prisma.interviewSession.findUnique({
    where: { id: params.sessionId },
    include: {
      sessionQuestions: {
        orderBy: { order: "asc" },
        include: {
          question: true,
          answer: {
            include: { score: true },
          },
        },
      },
    },
  });

  if (!interviewSession) redirect("/dashboard");
  if (interviewSession.userId !== session.user.id) redirect("/dashboard");

  // Derived display values
  const overallScore = interviewSession.totalScore ?? 75;
  const grade = gradeFromScore(overallScore);
  const subjectLabel =
    PAPER_LABELS[interviewSession.paper as Paper] ?? interviewSession.paper;
  const duration = formatDuration(
    interviewSession.startedAt,
    interviewSession.completedAt
  );
  const dateLabel = interviewSession.completedAt
    ? new Date(interviewSession.completedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      {/* ── Top card ──────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 shadow-sm">
        <ScoreRing score={Math.round(overallScore)} size="lg" />
        <Badge variant={gradeBadgeVariant(grade)} className="text-sm px-4 py-1">
          {grade}
        </Badge>

        <div className="grid grid-cols-3 divide-x w-full text-center mt-2">
          <div className="px-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Subject
            </p>
            <p className="mt-1 font-medium text-sm">{subjectLabel}</p>
          </div>
          <div className="px-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Date
            </p>
            <p className="mt-1 font-medium text-sm">{dateLabel}</p>
          </div>
          <div className="px-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Duration
            </p>
            <p className="mt-1 font-medium text-sm">{duration}</p>
          </div>
        </div>
      </div>

      {/* ── Performance breakdown ────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Performance</h2>
        <Accordion type="multiple" className="space-y-2">
          {interviewSession.sessionQuestions.map((sq) => {
            const score = sq.answer?.score ?? null;
            const scoreValue = score?.total ?? null;
            const answerText = sq.answer?.transcription ?? null;

            return (
              <AccordionItem
                key={sq.id}
                value={sq.id}
                className="rounded-lg border px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex w-full items-center justify-between pr-2 gap-4">
                    <span className="text-sm text-left">
                      <span className="font-medium">Q{sq.order}:</span>{" "}
                      {sq.question.text.length > 60
                        ? sq.question.text.slice(0, 60) + "…"
                        : sq.question.text}
                    </span>
                    {scoreValue !== null && (
                      <Badge
                        variant={scoreBadgeVariant(scoreValue)}
                        className="shrink-0"
                      >
                        {Math.round(scoreValue)}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  {/* Full question */}
                  <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {sq.question.text}
                  </div>

                  {/* Answer */}
                  {answerText && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                        Your Answer
                      </p>
                      <p className="text-sm">{answerText}</p>
                    </div>
                  )}

                  {/* Score detail */}
                  {score ? (
                    <div className="space-y-2">
                      {score.keyPointsCovered.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
                            Strengths
                          </p>
                          <ul className="space-y-0.5">
                            {score.keyPointsCovered.map((pt, i) => (
                              <li
                                key={i}
                                className="text-sm text-green-700 before:content-['✓_']"
                              >
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {score.keyPointsMissed.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">
                            Gaps
                          </p>
                          <ul className="space-y-0.5">
                            {score.keyPointsMissed.map((pt, i) => (
                              <li
                                key={i}
                                className="text-sm text-red-700 before:content-['✗_']"
                              >
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Answer recorded
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* ── Bottom actions ───────────────────────────────── */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href="/interview/setup">Take Another Interview</Link>
        </Button>
      </div>
    </div>
  );
}
