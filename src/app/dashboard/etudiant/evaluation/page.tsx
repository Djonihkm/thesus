// src/app/dashboard/etudiant/evaluation/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ScoreBar } from "@/components/dashboard/ScoreBar";
import type { EvaluationCriterion } from "@/lib/evaluation-criteria";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function EvaluationPage() {
  const user = await requireRole("STUDENT");

  const memoires = await prisma.memoire.findMany({
    where: { studentId: user.id, status: "COMPLETED" },
    orderBy: { submittedAt: "desc" },
    include: { evaluations: { include: { jury: { select: { name: true } } } } },
  });

  if (memoires.length === 0) {
    return (
      <>
        <DashboardHeader
          eyebrow="Mon évaluation"
          title="Mon évaluation"
          description="La note et les retours du jury sur vos soutenances apparaîtront ici."
        />
        <p className="mt-10 text-sm text-ink-muted">
          Aucun mémoire traité pour le moment. Déposez et faites auditer un mémoire pour débloquer
          l&apos;évaluation par le jury.
        </p>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        eyebrow="Mon évaluation"
        title="Mon évaluation"
        description="La note et les retours du jury sur vos soutenances."
      />

      <div className="mt-10 flex flex-col gap-6">
        {memoires.map((memoire) => {
          const evaluation = memoire.evaluations[0];
          const criteria = evaluation?.criteria as unknown as EvaluationCriterion[] | undefined;

          return (
            <div
              key={memoire.id}
              className="rounded-2xl border border-border-dark/10 bg-surface-light p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">{memoire.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Déposé le {dateFormatter.format(memoire.submittedAt)}
                  </p>
                </div>
                {evaluation ? (
                  <span className="shrink-0 font-serif text-2xl font-normal tracking-[-0.01em] text-ink">
                    {evaluation.grade.toFixed(1)}/20
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-surface-neutral px-3 py-1 text-xs font-medium tracking-wide text-ink-muted">
                    En attente du jury
                  </span>
                )}
              </div>

              {evaluation ? (
                <>
                  {criteria && criteria.length > 0 ? (
                    <div className="mt-6 flex flex-col gap-4">
                      {criteria.map((criterion) => (
                        <ScoreBar key={criterion.label} label={criterion.label} value={criterion.score} />
                      ))}
                    </div>
                  ) : null}

                  {evaluation.comments ? (
                    <div className="mt-6 rounded-xl border border-border-dark/10 bg-surface-neutral p-4">
                      <p className="text-xs font-medium tracking-wide text-ink-muted">
                        Commentaires du jury
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink">{evaluation.comments}</p>
                    </div>
                  ) : null}

                  <p className="mt-4 text-xs text-ink-muted">Évalué par {evaluation.jury.name}</p>
                </>
              ) : (
                <p className="mt-4 text-sm text-ink-muted">
                  Ce mémoire n&apos;a pas encore été évalué par un membre du jury.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
