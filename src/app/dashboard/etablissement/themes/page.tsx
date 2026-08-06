import { Lightbulb } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreateThemeModal } from "@/components/dashboard/CreateThemeModal";
import { ThemesListSection } from "@/components/dashboard/ThemesListSection";
import { ThemeSelectionReviewRow } from "@/components/dashboard/ThemeSelectionReviewRow";
import { ThemeClosureReviewRow } from "@/components/dashboard/ThemeClosureReviewRow";

export default async function EtablissementThemesPage() {
  const user = await requireRole("INSTITUTION");

  if (!user.institutionId) {
    return (
      <DashboardHeader
        eyebrow="Thèmes"
        title="Bibliothèque de thèmes"
        description="Votre établissement n'est pas encore rattaché à la plateforme."
      />
    );
  }

  const institutionId = user.institutionId;

  const [themes, pendingSelections, pendingClosures] = await Promise.all([
    prisma.theme.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" },
      include: {
        proposedBy: { select: { name: true } },
        takenBy: { select: { name: true } },
      },
    }),
    prisma.themeSelection.findMany({
      where: { status: "PENDING", theme: { institutionId } },
      orderBy: { createdAt: "asc" },
      include: {
        theme: { select: { title: true, category: true } },
        student: { select: { name: true, fieldOfStudy: true } },
      },
    }),
    prisma.themeClosureRequest.findMany({
      where: { status: "PENDING", theme: { institutionId } },
      orderBy: { createdAt: "asc" },
      include: {
        theme: { select: { title: true, category: true } },
        student: { select: { name: true } },
      },
    }),
  ]);

  const themeSummaries = themes.map((theme) => ({
    id: theme.id,
    title: theme.title,
    description: theme.description,
    category: theme.category,
    status: theme.status,
    proposedByName: theme.proposedBy?.name ?? null,
    takenByName: theme.takenBy?.name ?? null,
  }));

  return (
    <>
      <DashboardHeader
        eyebrow="Thèmes"
        title="Bibliothèque de thèmes"
        description="Proposez des thèmes de mémoire aux étudiants et validez leurs propositions."
        actions={themeSummaries.length > 0 ? <CreateThemeModal variant="compact" /> : null}
      />

      {pendingSelections.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
            Demandes de choix en attente ({pendingSelections.length})
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {pendingSelections.map((selection) => (
              <ThemeSelectionReviewRow
                key={selection.id}
                selectionId={selection.id}
                themeTitle={selection.theme.title}
                themeCategory={selection.theme.category}
                studentName={selection.student.name}
                studentFieldOfStudy={selection.student.fieldOfStudy}
              />
            ))}
          </div>
        </div>
      ) : null}

      {pendingClosures.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
            Demandes de clôture en attente ({pendingClosures.length})
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {pendingClosures.map((closure) => (
              <ThemeClosureReviewRow
                key={closure.id}
                closureId={closure.id}
                themeTitle={closure.theme.title}
                themeCategory={closure.theme.category}
                studentName={closure.student.name}
                reason={closure.reason}
              />
            ))}
          </div>
        </div>
      ) : null}

      {themeSummaries.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border-neutral bg-surface-light px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
            <Lightbulb size={20} />
          </div>
          <h2 className="mt-5 text-lg font-medium tracking-[-0.01em] text-ink">
            Aucun thème pour le moment
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
            Créez un thème pour que vos étudiants puissent le demander, ou attendez leurs
            propositions.
          </p>
          <CreateThemeModal variant="cta" />
        </div>
      ) : (
        <div className="mt-10">
          <ThemesListSection themes={themeSummaries} />
        </div>
      )}
    </>
  );
}
