// src/app/dashboard/jury/memoires/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EvaluationForm } from "@/components/dashboard/EvaluationForm";
import { DocumentViewerModal } from "@/components/dashboard/DocumentViewerModal";
import { Button } from "@/components/ui/Button";
import type { EvaluationCriterion } from "@/lib/evaluation-criteria";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function JuryMemoireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("JURY");

  const memoire = await prisma.memoire.findUnique({
    where: { id },
    include: {
      student: { select: { name: true } },
      auditReport: true,
      evaluations: { where: { juryId: user.id } },
      assignments: { where: { juryId: user.id, status: "VALIDATED" } },
    },
  });

  if (!memoire || !user.institutionId || memoire.institutionId !== user.institutionId) {
    notFound();
  }

  // Accès restreint aux mémoires assignés à ce jury, ou déjà évalués par lui (historique
  // antérieur à l'assignation) — cohérent avec la liste filtrée de /dashboard/jury/memoires.
  const isAssignedOrEvaluated = memoire.assignments.length > 0 || memoire.evaluations.length > 0;
  if (!isAssignedOrEvaluated) {
    notFound();
  }

  if (memoire.status !== "COMPLETED") {
    redirect("/dashboard/jury/memoires");
  }

  const existingEvaluation = memoire.evaluations[0];
  const existingCriteria = existingEvaluation?.criteria as unknown as
    | EvaluationCriterion[]
    | undefined;

  return (
    <>
      <DashboardHeader
        eyebrow="Évaluation de soutenance"
        title={memoire.title}
        description={`${memoire.student.name} · déposé le ${dateFormatter.format(memoire.submittedAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <DocumentViewerModal
              documentUrl={`/api/jury/memoires/${memoire.id}/document`}
              title={memoire.title}
              fileType={memoire.fileType}
            />
            <Button
              href={`/dashboard/jury/memoires/${memoire.id}/document`}
              variant="outline"
              className="px-5! py-2! text-xs"
            >
              Annoter le document
            </Button>
          </div>
        }
      />

      {memoire.auditReport ? (
        <div className="mt-8 rounded-2xl border border-border-dark/10 bg-surface-light p-6">
          <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            Rapport d&apos;audit (pour information)
          </span>
          <p className="mt-2 font-serif text-2xl font-normal tracking-[-0.01em] text-ink">
            {memoire.auditReport.score.toFixed(1)}/20
          </p>
        </div>
      ) : null}

      <div className="mt-10 rounded-2xl border border-border-dark/10 bg-surface-light p-6">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
          {existingEvaluation ? "Modifier votre évaluation" : "Évaluer la soutenance"}
        </h2>
        <div className="mt-6">
          <EvaluationForm
            memoireId={memoire.id}
            existingCriteria={existingCriteria}
            existingComments={existingEvaluation?.comments}
          />
        </div>
      </div>

      <Link
        href="/dashboard/jury/memoires"
        className="mt-8 inline-block text-sm font-medium text-accent hover:underline"
      >
        ← Retour aux mémoires
      </Link>
    </>
  );
}
