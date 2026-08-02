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
        <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
          {eyebrow}
        </span>
        <h1 className="mt-4 font-serif text-3xl font-normal tracking-[-0.01em] text-ink">
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