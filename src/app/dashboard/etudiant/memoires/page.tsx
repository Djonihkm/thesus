// src/app/dashboard/etudiant/memoires/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MemoiresListSection } from "@/components/dashboard/MemoiresListSection";
import { MemoireUploadForm } from "@/components/dashboard/MemoireUploadForm";
import { ThemeStatusBanner } from "@/components/dashboard/ThemeStatusBanner";
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
  // Le dépôt n'est plus conditionné à un thème (voir createMemoireAction) — seule
  // l'existence d'un rattachement à l'établissement reste requise.
  const canDeposit = Boolean(user.institutionId);

  return (
    <>
      <AutoRefresh enabled={hasProcessingMemoire} />

      <DashboardHeader
        eyebrow="Espace étudiant"
        title="Mes mémoires"
        description={
          canDeposit
            ? "Déposez un mémoire ou consultez le statut de ceux déjà envoyés."
            : "Votre établissement n'est pas encore rattaché à la plateforme."
        }
      />

      <div className="mt-10">
        {canDeposit ? (
          <div className="flex flex-col gap-6">
            <ThemeStatusBanner
              currentTheme={themeContext.currentTheme}
              pendingSelection={themeContext.pendingSelection}
              pendingClosure={themeContext.pendingClosure}
            />
            <MemoireUploadForm activeThemeTitle={themeContext.currentTheme?.title ?? null} />
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            Contactez le support pour rattacher votre compte à un établissement et débloquer le
            dépôt de mémoire.
          </p>
        )}
      </div>

      {hasAnyMemoire ? (
        <div className="mt-10">
          <MemoiresListSection memoires={memoires} />
        </div>
      ) : null}
    </>
  );
}
