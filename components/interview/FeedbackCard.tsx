"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ScoreRing from "./ScoreRing";
import MissingConceptChip from "./MissingConceptChip";
import type { AIFeedback } from "@/types";

type Props = {
  feedback: AIFeedback;
  visible: boolean;
};

function gradeBadgeVariant(
  grade: string
): "default" | "secondary" | "destructive" | "outline" {
  if (grade === "Excellent" || grade === "Good") return "default";
  if (grade === "Average") return "secondary";
  return "destructive";
}

export default function FeedbackCard({ feedback, visible }: Props) {
  const [modelAnswerOpen, setModelAnswerOpen] = useState(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-xl border bg-card p-6 shadow-sm space-y-5"
        >
          {/* Top row: score ring + grade badge */}
          <div className="flex items-center justify-between">
            <ScoreRing score={feedback.score} size="sm" />
            <Badge variant={gradeBadgeVariant(feedback.grade)} className="text-sm px-3 py-1">
              {feedback.grade}
            </Badge>
          </div>

          {/* Strengths */}
          {feedback.strengths.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-green-700">Strengths</p>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {feedback.gaps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-red-700">Gaps</p>
              <ul className="space-y-1">
                {feedback.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Model answer collapsible */}
          <Collapsible open={modelAnswerOpen} onOpenChange={setModelAnswerOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
              Model Answer
              <ChevronDown
                className={`h-4 w-4 transition-transform ${modelAnswerOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground leading-relaxed">
              {feedback.model_answer}
            </CollapsibleContent>
          </Collapsible>

          {/* Missing concepts */}
          {feedback.missing_concepts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-muted-foreground">Missing Concepts</p>
              <div className="flex flex-wrap gap-2">
                {feedback.missing_concepts.map((c, i) => (
                  <MissingConceptChip key={i} concept={c} />
                ))}
              </div>
            </div>
          )}

          {/* Encouragement */}
          {feedback.encouragement && (
            <p className="text-sm italic text-muted-foreground border-t pt-4">
              {feedback.encouragement}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
