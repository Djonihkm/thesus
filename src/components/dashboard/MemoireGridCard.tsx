// src/components/dashboard/MemoireGridCard.tsx
import Link from "next/link";
import { FileText } from "lucide-react";
import { MemoireStatus } from "@prisma/client";
import { MemoireStatusBadge } from "./MemoireStatusBadge";
import { DeleteMemoireButton } from "./DeleteMemoireButton";

interface MemoireGridCardProps {
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

export function MemoireGridCard({ id, title, status, submittedAt }: MemoireGridCardProps) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10">
      <Link href={`/dashboard/etudiant/memoires/${id}`} className="absolute inset-0" aria-label={title} />

      <div className="pointer-events-none flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
            <FileText size={18} />
          </div>
          <MemoireStatusBadge status={status} />
        </div>
        <p className="mt-5 line-clamp-2 text-sm font-medium text-ink">{title}</p>
        <p className="mt-2 text-xs text-ink-muted">Déposé le {dateFormatter.format(submittedAt)}</p>
      </div>

      <div className="relative z-10 mt-4 flex justify-end">
        <DeleteMemoireButton memoireId={id} title={title} status={status} />
      </div>
    </div>
  );
}
