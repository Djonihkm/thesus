// src/components/dashboard/ScoreBar.tsx
import Link from "next/link";

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
  href?: string;
}

export function ScoreBar({ label, value, max = 20, href }: ScoreBarProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const labelContent = href ? (
    <Link href={href} className="truncate text-sm text-ink-muted hover:text-ink hover:underline">
      {label}
    </Link>
  ) : (
    <span className="truncate text-sm text-ink-muted">{label}</span>
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        {labelContent}
        <span className="shrink-0 text-sm font-medium text-ink">
          {value.toFixed(1)}/{max}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-neutral">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
