// src/app/dashboard/etudiant/progression/page.tsx
import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { ScoreBar } from "@/components/dashboard/ScoreBar";
import { QuizTrendChart } from "@/components/dashboard/QuizTrendChart";
import { Button } from "@/components/ui/Button";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default async function ProgressionPage() {
  const user = await requireRole("STUDENT");

  const memoires = await prisma.memoire.findMany({
    where: { studentId: user.id },
    orderBy: { submittedAt: "asc" },
    include: { auditReport: true },
  });

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { studentId: user.id },
    orderBy: { completedAt: "asc" },
    include: { quiz: { include: { memoire: { select: { title: true } } } } },
  });

  const auditedMemoires = memoires.filter((memoire) => memoire.auditReport);
  const averageAudit = average(auditedMemoires.map((memoire) => memoire.auditReport!.score));
  const averageQuiz = average(quizAttempts.map((attempt) => attempt.score));

  if (memoires.length === 0) {
    return (
      <>
        <DashboardHeader
          eyebrow="Ma progression"
          title="Ma progression"
          description="Suivez l'évolution de vos scores d'audit et de vos quiz au fil de vos mémoires."
        />
        <div className="mt-10 rounded-2xl border border-border-dark/10 bg-surface-light p-8 text-center">
          <p className="text-sm text-ink-muted">
            Déposez un premier mémoire pour commencer à suivre votre progression.
          </p>
          <Button href="/dashboard/etudiant/memoires" tone="light" variant="primary" className="mt-5">
            Déposer un mémoire
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        eyebrow="Ma progression"
        title="Ma progression"
        description="Suivez l'évolution de vos scores d'audit et de vos quiz au fil de vos mémoires."
      />

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Mémoires déposés" value={String(memoires.length)} />
        <StatTile
          label="Score d'audit moyen"
          value={averageAudit !== null ? `${averageAudit.toFixed(1)}/20` : "—"}
        />
        <StatTile
          label="Score de quiz moyen"
          value={averageQuiz !== null ? `${Math.round(averageQuiz)}%` : "—"}
        />
        <StatTile label="Quiz complétés" value={String(quizAttempts.length)} />
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
          Évolution des scores d&apos;audit
        </h2>
        {auditedMemoires.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Aucun audit terminé pour le moment. Le score de vos mémoires apparaîtra ici une fois
            leur traitement achevé.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-5 rounded-2xl border border-border-dark/10 bg-surface-light p-6">
            {auditedMemoires.map((memoire) => (
              <ScoreBar
                key={memoire.id}
                label={memoire.title}
                value={memoire.auditReport!.score}
                href={`/dashboard/etudiant/memoires/${memoire.id}/audit`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Évolution des quiz</h2>
        {quizAttempts.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Vous n&apos;avez pas encore passé de quiz. Retrouvez-les depuis la page de chaque
            mémoire traité.
          </p>
        ) : quizAttempts.length === 1 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Un seul quiz passé pour l&apos;instant ({quizAttempts[0].score}%). Passez-en d&apos;autres
            pour voir apparaître votre courbe de progression.
          </p>
        ) : (
          <div className="mt-5 rounded-2xl border border-border-dark/10 bg-surface-light p-6">
            <QuizTrendChart
              attempts={quizAttempts.map((attempt) => ({
                score: attempt.score,
                label: attempt.quiz.memoire.title,
              }))}
            />
          </div>
        )}

        {quizAttempts.length > 0 ? (
          <div className="mt-5 flex flex-col gap-2">
            {[...quizAttempts].reverse().map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border-dark/10 bg-surface-light px-5 py-3 text-sm"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/etudiant/memoires/${attempt.quiz.memoireId}/quiz`}
                    className="truncate font-medium text-ink hover:underline"
                  >
                    {attempt.quiz.memoire.title}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {dateFormatter.format(attempt.completedAt)}
                  </p>
                </div>
                <span className="shrink-0 font-medium text-ink">{attempt.score}%</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
