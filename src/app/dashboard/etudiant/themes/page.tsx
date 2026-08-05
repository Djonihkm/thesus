// src/app/dashboard/etudiant/themes/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ThemeStatusBanner } from "@/components/dashboard/ThemeStatusBanner";
import { ThemeBrowser } from "@/components/dashboard/ThemeBrowser";
import { getStudentThemeContext, getStudentThemeRequests } from "@/lib/student-theme";

export default async function EtudiantThemesPage() {
  const user = await requireRole("STUDENT");

  if (!user.institutionId) {
    return (
      <DashboardHeader
        eyebrow="Thème"
        title="Choisir un thème"
        description="Votre établissement n'est pas encore rattaché à la plateforme."
      />
    );
  }

  const [{ currentTheme, pendingSelection, availableThemes }, myRequests] = await Promise.all([
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
          <ThemeStatusBanner currentTheme={currentTheme} pendingSelection={pendingSelection} />
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
