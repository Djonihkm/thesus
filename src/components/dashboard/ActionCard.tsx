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
      className={`group flex h-full flex-col justify-between rounded-2xl border bg-surface-light p-6 shadow-md shadow-ink/8 transition ${
        isLocked
          ? "border-border-neutral opacity-50"
          : "border-border-neutral hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
            {icon}
          </div>
          <StatusBadge status={status} />
        </div>
        <h3 className="mt-5 text-lg font-medium tracking-[-0.01em] text-ink">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
        {summary && (
          <p className="mt-3 font-serif text-lg font-normal text-accent-dark">{summary}</p>
        )}
      </div>

      {!isLocked && href && (
        <span className="mt-6 inline-flex items-center text-sm font-medium text-accent-dark group-hover:underline">
          {ctaLabel} →
        </span>
      )}
    </div>
  );

  if (isLocked || !href) return content;

  return <Link href={href}>{content}</Link>;
}
