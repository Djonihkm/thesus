"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { approveThemeSelectionAction, rejectThemeSelectionAction } from "@/lib/actions/themes";

interface ThemeSelectionReviewRowProps {
  selectionId: string;
  themeTitle: string;
  themeCategory: string;
  studentName: string;
  studentFieldOfStudy: string | null;
}

export function ThemeSelectionReviewRow({
  selectionId,
  themeTitle,
  themeCategory,
  studentName,
  studentFieldOfStudy,
}: ThemeSelectionReviewRowProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<"approved" | "rejected" | null>(null);

  async function handle(
    action: (id: string) => Promise<{ error?: string; success?: boolean }>,
    outcome: "approved" | "rejected",
  ) {
    setIsPending(true);
    setError(null);
    const result = await action(selectionId);
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
        Demande de {studentName} pour « {themeTitle} »{" "}
        {resolved === "approved" ? "approuvée" : "rejetée"}.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-md shadow-ink/8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            {themeCategory}
          </span>
          <h3 className="mt-1 text-base font-medium text-ink">{themeTitle}</h3>
          <p className="mt-2 text-xs text-ink-muted">
            Demandé par {studentName}
            {studentFieldOfStudy ? ` · ${studentFieldOfStudy}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(approveThemeSelectionAction, "approved")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent-dark transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Approuver la demande"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(rejectThemeSelectionAction, "rejected")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-flag-soft text-flag transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Rejeter la demande"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-flag">{error}</p> : null}
    </div>
  );
}
