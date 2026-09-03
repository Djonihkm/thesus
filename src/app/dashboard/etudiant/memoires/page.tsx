// src/app/dashboard/etudiant/memoires/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MemoiresListSection } from "@/components/dashboard/MemoiresListSection";
import { MemoireUploadForm } from "@/components/dashboard/MemoireUploadForm";
import { ThemeStatusBanner } from "@/components/dashboard/ThemeStatusBanner";
import { InstitutionStatusBanner } from "@/components/dashboard/InstitutionStatusBanner";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { getStudentThemeContext } from "@/lib/student-theme";

export const maxDuration = 60;

export default async function MemoiresPage() {
  const user = await requireRole("STUDENT");

  const [memoires, themeContext] = await Promise.all([
    prisma.memoire.findMany({
      where: { studentId: user.id },
      orderBy: { submittedAt: "desc" },
    }),
    user.institutionId
      ? getStudentThemeContext(user.id, user.institutionId)
      : Promise.resolve({
          currentTheme: null,
          pendingSelection: null,
          pendingClosure: null,
          availableThemes: [],
        }),
  ]);

  const hasProcessingMemoire = memoires.some(
    (memoire) => memoire.status === "PENDING" || memoire.status === "PROCESSING",
  );
  const hasAnyMemoire = memoires.length > 0;

  return (
    <>
      <AutoRefresh enabled={hasProcessingMemoire} />

      <DashboardHeader
        eyebrow="Espace étudiant"
        title="Mes mémoires"
        description="Déposez un mémoire ou consultez le statut de ceux déjà envoyés."
      />

      <div className="mt-10 flex flex-col gap-6">
        {user.affiliatedInstitutionName ? (
          <InstitutionStatusBanner affiliatedInstitutionName={user.affiliatedInstitutionName} />
        ) : null}
        <ThemeStatusBanner
          currentTheme={themeContext.currentTheme}
          pendingSelection={themeContext.pendingSelection}
          pendingClosure={themeContext.pendingClosure}
        />
        <MemoireUploadForm activeThemeTitle={themeContext.currentTheme?.title ?? null} />
      </div>

      {hasAnyMemoire ? (
        <div className="mt-10">
          <MemoiresListSection memoires={memoires} />
        </div>
      ) : null}
    </>
  );
}
