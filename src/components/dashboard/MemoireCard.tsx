// src/components/dashboard/MemoireCard.tsx
import Link from "next/link";
import { FileText } from "lucide-react";
import { MemoireStatus } from "@prisma/client";
import { MemoireStatusBadge } from "./MemoireStatusBadge";

interface MemoireCardProps {
  id: string;
  title: string;
  status: MemoireStatus;
  submittedAt: Date;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function MemoireCard({ id, title, status, submittedAt }: MemoireCardProps) {
  return (
    <Link
      href={`/dashboard/etudiant/memoires/${id}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
          <FileText size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{title}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Déposé le {dateFormatter.format(submittedAt)}
          </p>
        </div>
      </div>
      <MemoireStatusBadge status={status} />
    </Link>
  );
}
