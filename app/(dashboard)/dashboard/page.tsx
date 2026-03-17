import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAPER_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SessionStatus, Paper } from "@/types";

// ── Helpers ────────────────────────────────────────────────

function statusVariant(
  status: SessionStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "ABANDONED":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: SessionStatus): string {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In Progress";
    case "ABANDONED":
      return "Abandoned";
    default:
      return "Setup";
  }
}

// ── Page ───────────────────────────────────────────────────

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const userId = session.user.id;
  const name =
    session.user.user_metadata?.full_name ??
    session.user.email?.split("@")[0] ??
    "Student";

  // Fetch all sessions for stats + recent list in one query
  const allSessions = await prisma.interviewSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      paper: true,
      status: true,
      totalScore: true,
      questionCount: true,
      createdAt: true,
    },
  });

  const completed = allSessions.filter((s) => s.status === "COMPLETED");
  const totalSessions = allSessions.length;
  const avgScore =
    completed.length > 0
      ? completed.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) /
        completed.length
      : 0;
  const recentSessions = allSessions.slice(0, 5);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* ── Welcome ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {name}</h1>
          <p className="text-muted-foreground mt-1">
            Ready to sharpen your CA Intermediate prep?
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/interview/setup">Start Interview</Link>
        </Button>
      </div>

      {/* ── Stats ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {completed.length > 0 ? avgScore.toFixed(1) : "—"}
              <span className="text-base font-normal text-muted-foreground ml-1">
                / 10
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Day Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              0
              <span className="text-base font-normal text-muted-foreground ml-1">
                days
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Sessions ─────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>

        {recentSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No sessions yet. Hit{" "}
                <strong className="text-foreground">Start Interview</strong> to
                begin your first mock!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((s) => (
              <Card key={s.id} className="hover:bg-muted/40 transition-colors">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-sm">
                        {PAPER_LABELS[s.paper as Paper]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.questionCount} question
                        {s.questionCount !== 1 ? "s" : ""} ·{" "}
                        {new Date(s.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {s.status === "COMPLETED" && s.totalScore !== null && (
                      <span className="text-sm font-semibold tabular-nums">
                        {s.totalScore.toFixed(1)}
                        <span className="text-muted-foreground font-normal">
                          /10
                        </span>
                      </span>
                    )}
                    <Badge variant={statusVariant(s.status as SessionStatus)}>
                      {statusLabel(s.status as SessionStatus)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Weak Areas ──────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Weak Areas</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {completed.length === 0
                ? "Complete your first session to see weak areas."
                : "Weak area analysis will appear after more sessions."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
