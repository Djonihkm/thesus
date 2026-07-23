// src/components/dashboard/MemoireStatusBadge.tsx
import { MemoireStatus } from "@prisma/client";

const STYLES: Record<
  MemoireStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  PENDING: {
    label: "En attente",
    className: "bg-surface-neutral text-ink-muted",
    pulse: true,
  },
  PROCESSING: {
    label: "En traitement",
    className: "bg-accent/15 text-accent",
    pulse: true,
  },
  COMPLETED: {
    label: "Traité",
    className: "bg-ink text-paper",
  },
  FAILED: {
    label: "Échec",
    className: "bg-red-50 text-red-700",
  },
};

export function MemoireStatusBadge({ status }: { status: MemoireStatus }) {
  const { label, className, pulse } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${className}`}
    >
      {pulse ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {label}
    </span>
  );
}
