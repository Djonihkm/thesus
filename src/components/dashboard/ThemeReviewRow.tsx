"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { validateThemeAction, rejectThemeAction } from "@/lib/actions/themes";

interface ThemeReviewRowProps {
  themeId: string;
  title: string;
  category: string;
  description: string | null;
  proposedByName: string;
}

export function ThemeReviewRow({
  themeId,
  title,
  category,
  description,
  proposedByName,
}: ThemeReviewRowProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<"validated" | "rejected" | null>(null);

  async function handle(action: (id: string) => Promise<{ error?: string; success?: boolean }>, outcome: "validated" | "rejected") {
    setIsPending(true);
    setError(null);
    const result = await action(themeId);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setResolved(outcome);
  }

  if (resolved) {
    return (
      <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 text-sm text-ink-muted">
        « {title} » {resolved === "validated" ? "validé" : "rejeté"}.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            {category}
          </span>
          <h3 className="mt-1 text-base font-medium text-ink">{title}</h3>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{description}</p>
          ) : null}
          <p className="mt-2 text-xs text-ink-muted">Proposé par {proposedByName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(validateThemeAction, "validated")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent-dark transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Valider le thème"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(rejectThemeAction, "rejected")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-flag-soft text-flag transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Rejeter le thème"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-flag">{error}</p> : null}
    </div>
  );
}
