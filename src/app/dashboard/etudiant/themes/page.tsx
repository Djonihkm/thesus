// src/app/dashboard/etudiant/themes/page.tsx
import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ThemeStatusBanner } from "@/components/dashboard/ThemeStatusBanner";
import { ThemeBrowser } from "@/components/dashboard/ThemeBrowser";
import { getStudentThemeContext, getStudentThemeRequests } from "@/lib/student-theme";

export default async function EtudiantThemesPage() {
  const user = await requireRole("STUDENT");

  // Les thèmes appartiennent au catalogue d'un établissement — sans établissement rattaché,
  // il n'y a rien à parcourir, contrairement au dépôt de mémoire qui reste libre (voir
  // InstitutionStatusBanner). Ce n'est pas un blocage de compte, seulement l'absence de
  // catalogue : le message et le lien de retour évitent que ça se lise comme un cul-de-sac.
  if (!user.institutionId) {
    return (
      <>
        <DashboardHeader
          eyebrow="Thème"
          title="Choisir un thème"
          description="Votre compte n'est pas encore rattaché à un établissement, donc aucun thème d'établissement n'est disponible pour l'instant."
        />
        <p className="mt-6 text-sm text-ink-muted">
          Cela n&apos;empêche pas de déposer et rédiger votre mémoire librement — voir{" "}
          <Link href="/dashboard/etudiant/memoires" className="text-accent-dark underline">
            Mes mémoires
          </Link>
          .
        </p>
      </>
    );
  }

  const [{ currentTheme, pendingSelection, pendingClosure, availableThemes }, myRequests] =
    await Promise.all([
      getStudentThemeContext(user.id, user.institutionId),
      getStudentThemeRequests(user.id),
    ]);

  return (
    <>
      <DashboardHeader
        eyebrow="Thème"
        title="Choisir un thème"
        description="Parcourez les thèmes proposés par votre établissement, ou proposez le vôtre."
      />

      {currentTheme || pendingSelection ? (
        <div className="mt-8">
          <ThemeStatusBanner
            currentTheme={currentTheme}
            pendingSelection={pendingSelection}
            pendingClosure={pendingClosure}
          />
        </div>
      ) : null}

      <ThemeBrowser
        availableThemes={availableThemes}
        pendingSelection={pendingSelection}
        myRequests={myRequests}
      />
    </>
  );
}
