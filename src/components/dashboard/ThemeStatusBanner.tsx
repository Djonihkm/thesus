// src/components/dashboard/ThemeStatusBanner.tsx
//
// Bloc informatif (pas de sélecteur inline) : le choix/la proposition de thème se fait
// désormais sur une page dédiée (/dashboard/etudiant/themes), qui passe mieux à l'échelle
// qu'un <select> quand l'institution a beaucoup de thèmes.
import Link from "next/link";
import type { StudentCurrentTheme } from "@/lib/student-theme";

export function ThemeStatusBanner({ currentTheme }: { currentTheme: StudentCurrentTheme | null }) {
  if (!currentTheme) {
    return (
      <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5">
        <p className="text-sm font-medium text-ink">Choisissez ou proposez un thème pour commencer</p>
        <p className="mt-1 text-xs text-ink-muted">
          Un thème validé est nécessaire avant de pouvoir déposer votre mémoire.
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

  if (currentTheme.status === "PROPOSED") {
    return (
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <p className="text-sm font-medium text-ink">Thème proposé : {currentTheme.title}</p>
        <p className="mt-1 text-xs text-ink-muted">
          En attente de validation par votre établissement — le dépôt de votre mémoire sera
          débloqué une fois le thème validé.
        </p>
      </div>
    );
  }

  if (currentTheme.status === "REJECTED") {
    return (
      <div className="rounded-2xl border border-flag/20 bg-flag-soft p-5">
        <p className="text-sm font-medium text-ink">
          Thème rejeté par l&apos;établissement : {currentTheme.title}
        </p>
        <Link
          href="/dashboard/etudiant/themes"
          className="mt-4 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85"
        >
          Choisir un autre thème
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5">
      <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
        {currentTheme.category}
      </span>
      <p className="mt-1 text-sm font-medium text-ink">Thème : {currentTheme.title}</p>
    </div>
  );
}
