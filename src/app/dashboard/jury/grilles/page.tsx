// src/app/dashboard/jury/grilles/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ReviewEvaluationModal } from "@/components/dashboard/ReviewEvaluationModal";
import { EVALUATION_CRITERIA_GUIDANCE, type EvaluationCriterion } from "@/lib/evaluation-criteria";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function JuryGrillesPage() {
  const user = await requireRole("JURY");

  const evaluations = await prisma.defenseEvaluation.findMany({
    where: { juryId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      memoire: { select: { id: true, title: true, student: { select: { name: true } } } },
    },
  });

  return (
    <>
      <DashboardHeader
        eyebrow="Grilles de notation"
        title="Grilles de notation"
        description="L'historique de vos évaluations et des repères pour noter de façon cohérente."
      />

      <div className="mt-10">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
          Historique des évaluations
        </h2>

        {evaluations.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Vous n&apos;avez pas encore soumis d&apos;évaluation.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="flex flex-col gap-4 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-md shadow-ink/8 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{evaluation.memoire.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {evaluation.memoire.student.name} · évalué le{" "}
                    {dateFormatter.format(evaluation.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="font-serif text-2xl font-normal text-accent-dark">
                    {evaluation.grade.toFixed(1)}
                    <span className="ml-1 text-xs font-sans font-medium text-ink-muted">/20</span>
                  </span>
                  <ReviewEvaluationModal
                    memoireId={evaluation.memoire.id}
                    memoireTitle={evaluation.memoire.title}
                    studentName={evaluation.memoire.student.name}
                    existingCriteria={evaluation.criteria as unknown as EvaluationCriterion[]}
                    existingComments={evaluation.comments}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
          Aide sur les critères de notation
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Des repères pour rester cohérent d&apos;une soutenance à l&apos;autre — pas un barème
          détaillé, juste ce qui distingue typiquement une note faible, moyenne et haute sur
          chaque critère.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EVALUATION_CRITERIA_GUIDANCE.map((criterion) => (
            <div
              key={criterion.label}
              className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-md shadow-ink/8"
            >
              <h3 className="text-sm font-medium text-ink">{criterion.label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{criterion.description}</p>

              <div className="mt-4 flex flex-col gap-3">
                {criterion.anchors.map((anchor) => (
                  <div key={anchor.range} className="flex gap-3">
                    <span className="w-14 shrink-0 font-serif text-sm font-normal text-accent-dark">
                      {anchor.range}
                    </span>
                    <span className="text-xs leading-relaxed text-ink-muted">{anchor.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
