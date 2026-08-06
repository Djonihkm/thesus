"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";
import { submitEvaluationAction, type EvaluationFormState } from "@/lib/actions/evaluation";
import { EVALUATION_CRITERIA_LABELS, type EvaluationCriterion } from "@/lib/evaluation-criteria";

const initialState: EvaluationFormState = {};

interface EvaluationFormProps {
  memoireId: string;
  existingCriteria?: EvaluationCriterion[];
  existingComments?: string | null;
  // Utilisé par ReviewEvaluationModal pour rafraîchir l'historique après une modification —
  // optionnel, sans effet sur l'usage existant depuis la page de détail du mémoire.
  onSuccess?: () => void;
}

export function EvaluationForm({
  memoireId,
  existingCriteria,
  existingComments,
  onSuccess,
}: EvaluationFormProps) {
  const boundAction = submitEvaluationAction.bind(null, memoireId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Ref "toujours à jour" plutôt qu'une dépendance directe sur onSuccess : un parent qui le
  // redéfinit à chaque rendu (closure inline, cas de ReviewEvaluationModal) ne doit pas
  // redéclencher l'effet tant que le succès lui-même n'a pas changé.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (state.success) onSuccessRef.current?.();
  }, [state.success]);

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const label of EVALUATION_CRITERIA_LABELS) {
      initial[label] = existingCriteria?.find((c) => c.label === label)?.score ?? 14;
    }
    return initial;
  });

  const average =
    Object.values(scores).reduce((sum, value) => sum + value, 0) / EVALUATION_CRITERIA_LABELS.length;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? <FormError message={state.error} /> : null}
      {state.success ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          Évaluation enregistrée.
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        {EVALUATION_CRITERIA_LABELS.map((label) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor={`criterion-${label}`} className="text-sm text-ink-muted">
                {label}
              </label>
              <span className="text-sm font-medium text-ink">{scores[label].toFixed(1)}/20</span>
            </div>
            <input
              id={`criterion-${label}`}
              name={`criterion-${label}`}
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={scores[label]}
              onChange={(event) =>
                setScores((current) => ({ ...current, [label]: Number(event.target.value) }))
              }
              className="w-full accent-accent"
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border-dark/10 bg-surface-neutral px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-muted">Note globale (moyenne des critères)</span>
          <span className="font-serif text-lg font-normal text-ink">{average.toFixed(1)}/20</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="comments" className="text-sm text-ink-muted">
          Commentaires (facultatif)
        </label>
        <textarea
          id="comments"
          name="comments"
          rows={4}
          defaultValue={existingComments ?? ""}
          className="rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent"
          placeholder="Retours destinés à l'étudiant…"
        />
      </div>

      <Button type="submit" tone="light" variant="primary" className="self-start" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer l'évaluation"}
      </Button>
    </form>
  );
}
