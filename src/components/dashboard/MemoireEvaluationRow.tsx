// src/components/dashboard/MemoireEvaluationRow.tsx
import Link from "next/link";
import { FileCheck2 } from "lucide-react";

interface MemoireEvaluationRowProps {
  id: string;
  title: string;
  studentName: string;
  submittedAt: Date;
  isEvaluated: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function MemoireEvaluationRow({
  id,
  title,
  studentName,
  submittedAt,
  isEvaluated,
}: MemoireEvaluationRowProps) {
  return (
    <Link
      href={`/dashboard/jury/memoires/${id}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-border-dark/10 bg-surface-light p-5 transition hover:border-accent/40 hover:shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-neutral text-ink">
          <FileCheck2 size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{title}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {studentName} · déposé le {dateFormatter.format(submittedAt)}
          </p>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${
          isEvaluated ? "bg-ink text-paper" : "bg-accent/15 text-accent"
        }`}
      >
        {isEvaluated ? "Évalué" : "À évaluer"}
      </span>
    </Link>
  );
}
