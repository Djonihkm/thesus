"use client";

import Link from "next/link";
import { JuryFunction } from "@prisma/client";
import { ToggleableListing } from "./ToggleableListing";
import { EditJuryAccountModal } from "./EditJuryAccountModal";
import { DeleteJuryAccountButton } from "./DeleteJuryAccountButton";

export interface JurySummary {
  id: string;
  name: string;
  specialty: string | null;
  juryFunction: JuryFunction | null;
  assignedCount: number;
}

function functionLabel(juryFunction: JuryFunction | null): string {
  if (juryFunction === "ENSEIGNANT") return " · Enseignant";
  if (juryFunction === "PROFESSIONNEL") return " · Professionnel";
  return "";
}

// Rendu commun aux deux vues : un lien "étiré" (position absolute) plutôt qu'un <Link>
// enveloppant tout le contenu, pour que les boutons modifier/supprimer (des <button>) ne
// se retrouvent jamais imbriqués dans un élément interactif — HTML invalide, comme déjà
// rencontré pour MemoireCard.
function JuryActions({ jury }: { jury: JurySummary }) {
  return (
    <div className="relative z-10 flex shrink-0 items-center gap-1">
      <EditJuryAccountModal juryId={jury.id} name={jury.name} specialty={jury.specialty ?? ""} />
      <DeleteJuryAccountButton juryId={jury.id} name={jury.name} />
    </div>
  );
}

export function JurysListSection({ jurors }: { jurors: JurySummary[] }) {
  return (
    <ToggleableListing
      items={jurors}
      getKey={(jury) => jury.id}
      renderList={(jury) => (
        <div className="group relative flex items-center justify-between gap-4 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10">
          <Link
            href={`/dashboard/etablissement/jurys/${jury.id}`}
            className="absolute inset-0"
            aria-label={jury.name}
          />
          <div className="pointer-events-none min-w-0">
            <p className="text-sm font-medium text-ink">{jury.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {jury.specialty ?? "Spécialité non renseignée"}
              {functionLabel(jury.juryFunction)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="pointer-events-none text-right font-serif text-2xl font-normal text-accent-dark">
              {jury.assignedCount}
              <span className="ml-1.5 text-xs font-sans font-medium text-ink-muted">
                mémoire{jury.assignedCount > 1 ? "s" : ""}
              </span>
            </span>
            <JuryActions jury={jury} />
          </div>
        </div>
      )}
      renderGrid={(jury) => (
        <div className="group relative flex h-full flex-col rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10">
          <Link
            href={`/dashboard/etablissement/jurys/${jury.id}`}
            className="absolute inset-0"
            aria-label={jury.name}
          />
          <div className="pointer-events-none flex flex-1 flex-col">
            <p className="text-sm font-medium text-ink">{jury.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {jury.specialty ?? "Spécialité non renseignée"}
              {functionLabel(jury.juryFunction)}
            </p>
            <span className="mt-4 font-serif text-2xl font-normal text-accent-dark">
              {jury.assignedCount}
              <span className="ml-1.5 text-xs font-sans font-medium text-ink-muted">
                mémoire{jury.assignedCount > 1 ? "s" : ""}
              </span>
            </span>
          </div>
          <div className="mt-4 flex justify-end">
            <JuryActions jury={jury} />
          </div>
        </div>
      )}
    />
  );
}
