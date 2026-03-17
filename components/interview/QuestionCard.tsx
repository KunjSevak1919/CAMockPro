import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PAPER_LABELS } from "@/types";
import type { Question } from "@/types";

type Props = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
};

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
}: Props) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <span className="text-sm font-medium text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </span>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {PAPER_LABELS[question.paper]}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-medium leading-relaxed">{question.text}</p>
        {question.topic && (
          <p className="mt-3 text-sm text-muted-foreground">
            Topic: {question.topic}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
