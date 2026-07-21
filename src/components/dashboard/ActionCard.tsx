// src/components/dashboard/ActionCard.tsx
import Link from "next/link";
import { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";
import { ServiceStatus } from "@/lib/dashboard-types";

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  status: ServiceStatus;
  summary?: string;
  href?: string;
  ctaLabel?: string;
}

export function ActionCard({
  icon,
  title,
  description,
  status,
  summary,
  href,
  ctaLabel = "Ouvrir",
}: ActionCardProps) {
  const isLocked = status === "locked";

  const content = (
    <div
      className={`group flex h-full flex-col justify-between rounded-2xl border border-border-dark/10 bg-surface-light p-6 transition ${
        isLocked ? "opacity-50" : "hover:border-accent/40 hover:shadow-sm"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-neutral text-ink">
            {icon}
          </div>
          <StatusBadge status={status} />
        </div>
        <h3 className="mt-4 text-lg font-medium tracking-[-0.01em] text-ink">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
        {summary && (
          <p className="mt-3 text-sm font-medium text-ink">{summary}</p>
        )}
      </div>

      {!isLocked && href && (
        <span className="mt-6 inline-flex items-center text-sm font-medium text-accent group-hover:underline">
          {ctaLabel} →
        </span>
      )}
    </div>
  );

  if (isLocked || !href) return content;

  return <Link href={href}>{content}</Link>;
}
