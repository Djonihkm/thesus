"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { EvaluationForm } from "@/components/dashboard/EvaluationForm";
import type { EvaluationCriterion } from "@/lib/evaluation-criteria";

interface ReviewEvaluationModalProps {
  memoireId: string;
  memoireTitle: string;
  studentName: string;
  existingCriteria: EvaluationCriterion[];
  existingComments: string | null;
}

// Revoir/modifier une évaluation déjà soumise — réutilise EvaluationForm tel quel, pré-rempli
// avec les valeurs existantes (le formulaire fait déjà la distinction création/mise à jour
// côté action, voir submitEvaluationAction).
export function ReviewEvaluationModal({
  memoireId,
  memoireTitle,
  studentName,
  existingCriteria,
  existingComments,
}: ReviewEvaluationModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink transition hover:bg-surface-neutral"
      >
        Revoir / modifier
      </button>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
              onClick={() => setIsOpen(false)}
            >
              <div
                className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-light p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-medium tracking-[-0.01em] text-ink">
                      {memoireTitle}
                    </h2>
                    <p className="mt-1 text-xs text-ink-muted">{studentName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Fermer"
                    className="shrink-0 rounded-full p-1.5 text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-5">
                  <EvaluationForm
                    memoireId={memoireId}
                    existingCriteria={existingCriteria}
                    existingComments={existingComments}
                    onSuccess={() => router.refresh()}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
