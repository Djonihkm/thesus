import type { ReactNode } from "react";

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <span className="text-sm font-medium tracking-wide text-accent">{eyebrow}</span>
      <h1 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-ink">{title}</h1>
      <p className="mt-3 leading-relaxed text-ink-muted">{subtitle}</p>

      <div className="mt-10 rounded-2xl border border-ink/10 bg-surface-light px-6 py-8 sm:px-8">
        {children}
      </div>
    </div>
  );
}
