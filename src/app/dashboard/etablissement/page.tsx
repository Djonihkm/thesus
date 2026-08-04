import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { Button } from "@/components/ui/Button";

export default async function EtablissementDashboardPage() {
  const user = await requireRole("INSTITUTION");

  if (!user.institutionId) {
    return (
      <DashboardHeader
        eyebrow="Espace établissement"
        title={`Bonjour ${user.name}`}
        description="Votre établissement n'est pas encore rattaché à la plateforme. Contactez le support pour débloquer cet espace."
      />
    );
  }

  const institutionId = user.institutionId;

  const [studentsCount, jurorsCount, memoiresCount, pendingThemesCount, memoires] =
    await Promise.all([
      prisma.user.count({ where: { institutionId, role: "STUDENT" } }),
      prisma.user.count({ where: { institutionId, role: "JURY" } }),
      prisma.memoire.count({ where: { institutionId } }),
      prisma.theme.count({ where: { institutionId, status: "PROPOSED" } }),
      prisma.memoire.findMany({
        where: { institutionId },
        include: {
          theme: true,
          assignments: { orderBy: { assignedAt: "desc" }, take: 1 },
        },
      }),
    ]);

  const toAssignCount = memoires.filter(
    (memoire) =>
      memoire.theme?.status === "VALIDATED" &&
      memoire.assignments[0]?.status !== "VALIDATED",
  ).length;

  return (
    <>
      <DashboardHeader
        eyebrow="Espace établissement"
        title={`Bonjour ${user.name}`}
        description="Pilotez les thèmes de mémoire et l'assignation des jurys de votre établissement."
      />

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Étudiants" value={String(studentsCount)} />
        <StatTile label="Jurys" value={String(jurorsCount)} />
        <StatTile label="Mémoires déposés" value={String(memoiresCount)} />
        <StatTile label="Mémoires à assigner" value={String(toAssignCount)} />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5">
          <div className="flex-1">
            <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
              Thèmes en attente de validation
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {pendingThemesCount > 0
                ? `${pendingThemesCount} thème(s) proposé(s) par des étudiants attendent votre validation.`
                : "Aucune proposition en attente pour le moment."}
            </p>
          </div>
          <Button
            href="/dashboard/etablissement/themes"
            tone="light"
            variant="outline"
            className="mt-5 self-start text-sm"
          >
            Voir la bibliothèque de thèmes
          </Button>
        </div>

        <div className="flex flex-col rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5">
          <div className="flex-1">
            <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
              Mémoires à assigner à un jury
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {toAssignCount > 0
                ? `${toAssignCount} mémoire(s) ont un thème validé mais aucun jury assigné.`
                : "Tous les mémoires avec un thème validé ont un jury assigné."}
            </p>
          </div>
          <Button
            href="/dashboard/etablissement/memoires"
            tone="light"
            variant="outline"
            className="mt-5 self-start text-sm"
          >
            Voir la bibliothèque de mémoires
          </Button>
        </div>

        <div className="flex flex-col rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5">
          <div className="flex-1">
            <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Jurys</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {jurorsCount > 0
                ? `${jurorsCount} jury(s) rattaché(s) à votre établissement.`
                : "Aucun jury rattaché pour le moment."}
            </p>
          </div>
          <Button
            href="/dashboard/etablissement/jurys"
            tone="light"
            variant="outline"
            className="mt-5 self-start text-sm"
          >
            Voir la gestion des jurys
          </Button>
        </div>
      </div>
    </>
  );
}
