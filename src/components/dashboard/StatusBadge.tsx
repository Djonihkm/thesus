// src/components/dashboard/StatusBadge.tsx
import { ServiceStatus } from "@/lib/dashboard-types";

const STYLES: Record<ServiceStatus, { label: string; className: string }> = {
  locked: {
    label: "Verrouillé",
    className: "bg-surface-neutral text-ink-muted",
  },
  available: {
    label: "Disponible",
    className: "bg-surface-neutral text-ink",
  },
  in_progress: {
    label: "En cours",
    className: "bg-accent/15 text-accent",
  },
  done: {
    label: "Terminé",
    className: "bg-ink text-paper",
  },
  alert: {
    label: "À vérifier",
    className: "bg-flag-soft text-flag",
  },
};

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}