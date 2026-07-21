// src/components/dashboard/DashboardHeader.tsx
import { ReactNode } from "react";

interface DashboardHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function DashboardHeader({
  eyebrow,
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <span className="text-sm font-medium tracking-wide text-accent">
          {eyebrow}
        </span>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-ink">
          {title}
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>
      {actions}
    </div>
  );
}