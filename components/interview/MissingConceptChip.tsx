import { XCircle } from "lucide-react";

type Props = {
  concept: string;
};

export default function MissingConceptChip({ concept }: Props) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      <XCircle className="h-3 w-3 shrink-0" />
      {concept}
    </span>
  );
}
