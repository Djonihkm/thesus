"use client";

import { useState } from "react";
import { assignJuryToMemoireAction } from "@/lib/actions/assignments";

interface JurorOption {
  id: string;
  name: string;
  score: number;
}

interface CurrentAssignment {
  juryId: string;
  juryName: string;
}

// Réassignation : le jury actuellement assigné à un mémoire peut démissionner, être récusé,
// ou simplement ne plus convenir — jusqu'ici, une fois VALIDATED, ce contrôle disparaissait
// entièrement de l'UI, sans aucun moyen de changer de jury (l'action assignJuryToMemoireAction
// elle-même le permettait déjà : append-only, voir assignments.ts — seule l'UI bloquait).
// Bloquait en cascade la suppression du compte jury (deleteJuryAccountAction refuse tant
// qu'une assignation active existe) : un jury indisponible ne pouvait ni être remplacé sur
// ses mémoires, ni voir son compte supprimé.
export function AssignJuryControl({
  memoireId,
  jurors,
  currentAssignment,
}: {
  memoireId: string;
  jurors: JurorOption[];
  currentAssignment?: CurrentAssignment;
}) {
  const [isReassigning, setIsReassigning] = useState(!currentAssignment);
  const [selected, setSelected] = useState(currentAssignment?.juryId ?? jurors[0]?.id ?? "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedName, setAssignedName] = useState<string | null>(null);

  async function handleAssign() {
    if (!selected) return;
    setIsPending(true);
    setError(null);
    const result = await assignJuryToMemoireAction(memoireId, selected);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setAssignedName(jurors.find((juror) => juror.id === selected)?.name ?? null);
    setIsReassigning(false);
  }

  if (assignedName) {
    return <span className="text-sm font-medium text-ink">Assigné à {assignedName}</span>;
  }

  if (!isReassigning && currentAssignment) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">Assigné à {currentAssignment.juryName}</span>
        <button
          type="button"
          onClick={() => setIsReassigning(true)}
          className="text-xs font-medium text-ink-muted underline decoration-dotted hover:text-ink"
        >
          Réassigner
        </button>
      </div>
    );
  }

  if (jurors.length === 0) {
    return <span className="text-xs text-ink-muted">Aucun jury dans l&apos;établissement</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="rounded-lg border border-ink/15 bg-surface-light px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent"
        >
          {jurors.map((juror, index) => (
            <option key={juror.id} value={juror.id}>
              {juror.name}
              {!currentAssignment && index === 0 && juror.score > 0 ? " (suggéré)" : ""}
              {currentAssignment?.juryId === juror.id ? " (actuel)" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={isPending}
          className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "…" : currentAssignment ? "Réassigner" : "Assigner"}
        </button>
        {currentAssignment ? (
          <button
            type="button"
            onClick={() => setIsReassigning(false)}
            disabled={isPending}
            className="text-xs font-medium text-ink-muted underline decoration-dotted hover:text-ink disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        ) : null}
      </div>
      {error ? <span className="text-xs text-flag">{error}</span> : null}
    </div>
  );
}
