// src/components/dashboard/PlagiarismPassages.tsx
"use client";

import { useState } from "react";
import type { PlagiarismPassage } from "@/lib/plagiarism";

const VISIBLE_BY_DEFAULT = 3;

export function PlagiarismPassages({ passages }: { passages: PlagiarismPassage[] }) {
  const [expanded, setExpanded] = useState(false);
  if (passages.length === 0) return null;

  const visible = expanded ? passages : passages.slice(0, VISIBLE_BY_DEFAULT);
  const hiddenCount = passages.length - visible.length;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border-dark/10 pt-4">
      {visible.map((passage, index) => (
        <div
          key={index}
          className="rounded-xl border border-border-dark/10 bg-surface-neutral/40 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                passage.kind === "exact"
                  ? "bg-flag-soft text-flag"
                  : "bg-accent/10 text-accent-dark"
              }`}
            >
              {passage.kind === "exact" ? "Copie quasi-exacte" : "Similarité sémantique"}
            </span>
            <span className="text-xs font-medium text-ink-muted">{passage.score}%</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
                Votre texte
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{passage.studentExcerpt}</p>
            </div>
            <div className="lg:border-l lg:border-border-dark/10 lg:pl-3">
              <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
                Mémoire comparé
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{passage.matchedExcerpt}</p>
            </div>
          </div>
        </div>
      ))}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="self-start text-xs font-medium text-ink-muted underline decoration-dotted hover:text-ink"
        >
          Voir {hiddenCount} passage{hiddenCount > 1 ? "s" : ""} supplémentaire
          {hiddenCount > 1 ? "s" : ""}
        </button>
      ) : null}
    </div>
  );
}
