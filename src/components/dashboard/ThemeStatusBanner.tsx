// src/components/dashboard/ThemeStatusBanner.tsx
//
// Bloc purement informatif, jamais bloquant : le dépôt de mémoire (audit, quiz,
// anti-plagiat, simulation de jury) est un usage libre, indépendant d'un thème — voir
// createMemoireAction. Un thème actif ne conditionne que le suivi jury officiel
// (assignation, voir /dashboard/etablissement/memoires). Le choix/la proposition de thème
// se fait sur une page dédiée (/dashboard/etudiant/themes), qui passe mieux à l'échelle
// qu'un <select> quand l'institution a beaucoup de thèmes.
//
// currentTheme n'est renseigné que via une demande de sélection APPROVED (voir
// approveThemeSelectionAction) — il pointe donc toujours vers un thème déjà VALIDATED, plus
// besoin de distinguer ici les statuts PROPOSED/REJECTED d'un thème courant (ce cas ne peut
// plus se produire). Le suivi détaillé des propositions/demandes en cours vit dans "Mes
// demandes" (/dashboard/etudiant/themes).
import Link from "next/link";
import { CloseThemeModal } from "./CloseThemeModal";
import type {
  PendingThemeClosure,
  PendingThemeSelection,
  StudentCurrentTheme,
} from "@/lib/student-theme";

const CLOSURE_REASON_LABEL: Record<PendingThemeClosure["reason"], string> = {
  COMPLETED: "terminé",
  ABANDONED: "abandon",
};

export function ThemeStatusBanner({
  currentTheme,
  pendingSelection = null,
  pendingClosure = null,
}: {
  currentTheme: StudentCurrentTheme | null;
  pendingSelection?: PendingThemeSelection | null;
  pendingClosure?: PendingThemeClosure | null;
}) {
  if (currentTheme) {
    return (
      <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
              {currentTheme.category}
            </span>
            <p className="mt-1 text-sm font-medium text-ink">Thème : {currentTheme.title}</p>
          </div>
          {!pendingClosure ? (
            <CloseThemeModal themeId={currentTheme.id} themeTitle={currentTheme.title} />
          ) : null}
        </div>
        {pendingClosure ? (
          <p className="mt-3 text-xs text-ink-muted">
            Demande de clôture en attente ({CLOSURE_REASON_LABEL[pendingClosure.reason]}) — en
            attente de validation de votre établissement. Votre thème reste actif en attendant.
          </p>
        ) : null}
      </div>
    );
  }

  if (pendingSelection) {
    return (
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <p className="text-sm font-medium text-ink">
          Demande en attente : {pendingSelection.theme.title}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          En attente de validation de votre choix par votre établissement — vous pouvez déposer
          votre mémoire dès maintenant, sans attendre cette validation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5">
      <p className="text-sm font-medium text-ink">Aucun thème actif</p>
      <p className="mt-1 text-xs text-ink-muted">
        Vous pouvez déposer votre mémoire dès maintenant, avec ou sans thème. Choisissez ou
        proposez un thème pour bénéficier du suivi jury officiel de votre établissement.
      </p>
      <Link
        href="/dashboard/etudiant/themes"
        className="mt-4 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85"
      >
        Choisir ou proposer un thème
      </Link>
    </div>
  );
}
