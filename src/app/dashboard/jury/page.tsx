// src/app/dashboard/jury/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { Button } from "@/components/ui/Button";
import { MemoireEvaluationRow } from "@/components/dashboard/MemoireEvaluationRow";

const PENDING_PREVIEW_LIMIT = 5;

export default async function JuryDashboardPage() {
  const user = await requireRole("JURY");

  if (!user.institutionId) {
    return (
      <>
        <DashboardHeader
          eyebrow="Espace jury"
          title={`Bonjour ${user.name}`}
          description="Votre établissement n'est pas encore rattaché à la plateforme. Contactez le support pour débloquer l'accès aux mémoires à évaluer."
        />
      </>
    );
  }

  const memoires = await prisma.memoire.findMany({
    where: { institutionId: user.institutionId, status: "COMPLETED" },
    orderBy: { submittedAt: "desc" },
    include: { student: { select: { name: true } }, evaluations: { where: { juryId: user.id } } },
  });

  const evaluated = memoires.filter((memoire) => memoire.evaluations.length > 0);
  const pending = memoires.filter((memoire) => memoire.evaluations.length === 0);

  return (
    <>
      <DashboardHeader
        eyebrow="Espace jury"
        title={`Bonjour ${user.name}`}
        description="Consultez les mémoires prêts pour soutenance dans votre établissement et enregistrez vos évaluations."
      />

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Mémoires prêts pour évaluation" value={String(memoires.length)} />
        <StatTile label="En attente de votre évaluation" value={String(pending.length)} />
        <StatTile label="Évalués par vous" value={String(evaluated.length)} />
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
            Mémoires en attente d&apos;évaluation
          </h2>
          {memoires.length > 0 ? (
            <Button href="/dashboard/jury/memoires" variant="outline" tone="light" className="text-sm">
              Voir tous les mémoires
            </Button>
          ) : null}
        </div>

        {memoires.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Aucun mémoire prêt pour évaluation dans votre établissement pour le moment.
          </p>
        ) : pending.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Vous avez évalué tous les mémoires disponibles. Bravo !
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {pending.slice(0, PENDING_PREVIEW_LIMIT).map((memoire) => (
              <MemoireEvaluationRow
                key={memoire.id}
                id={memoire.id}
                title={memoire.title}
                studentName={memoire.student.name}
                submittedAt={memoire.submittedAt}
                isEvaluated={false}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
