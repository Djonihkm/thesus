"use client";

import { useState } from "react";
import { assignJuryToMemoireAction } from "@/lib/actions/assignments";

interface JurorOption {
  id: string;
  name: string;
  score: number;
}

export function AssignJuryControl({
  memoireId,
  jurors,
}: {
  memoireId: string;
  jurors: JurorOption[];
}) {
  const [selected, setSelected] = useState(jurors[0]?.id ?? "");
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
  }

  if (assignedName) {
    return <span className="text-sm font-medium text-ink">Assigné à {assignedName}</span>;
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
              {index === 0 && juror.score > 0 ? " (suggéré)" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={isPending}
          className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "…" : "Assigner"}
        </button>
      </div>
      {error ? <span className="text-xs text-flag">{error}</span> : null}
    </div>
  );
}
