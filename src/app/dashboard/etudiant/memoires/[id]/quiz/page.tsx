// src/app/dashboard/etudiant/memoires/[id]/quiz/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GenerateModuleButton } from "@/components/dashboard/GenerateModuleButton";
import { QuizForm } from "@/components/dashboard/QuizForm";
import { generateQuizAction } from "@/lib/actions/quiz";

export const maxDuration = 60;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

  const memoire = await prisma.memoire.findUnique({
    where: { id },
    include: {
      quiz: {
        include: {
          questions: { orderBy: { order: "asc" } },
          attempts: { orderBy: { completedAt: "desc" } },
        },
      },
    },
  });

  if (!memoire || memoire.studentId !== user.id) {
    notFound();
  }

  if (memoire.status !== "COMPLETED") {
    redirect(`/dashboard/etudiant/memoires/${memoire.id}`);
  }

  return (
    <>
      <DashboardHeader
        eyebrow="Quiz personnalisé"
        title={memoire.title}
        description="Questions générées à partir du contenu de votre mémoire pour tester vos connaissances."
      />

      {!memoire.quiz ? (
        <div className="mt-10">
          <GenerateModuleButton
            action={generateQuizAction}
            memoireId={memoire.id}
            label="Générer mon quiz"
            pendingLabel="Génération en cours…"
            description="Cela prend quelques secondes — un quiz de 10 à 12 questions sera généré à partir de votre mémoire."
          />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {memoire.quiz.attempts.length > 0 && (
            <div>
              <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
                Historique des tentatives
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {memoire.quiz.attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-xl border border-border-dark/10 bg-surface-light px-4 py-3 text-sm"
                  >
                    <span className="text-ink-muted">
                      {dateFormatter.format(attempt.completedAt)}
                    </span>
                    <span className="font-medium text-ink">{attempt.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <QuizForm
            quizId={memoire.quiz.id}
            questions={memoire.quiz.questions.map((question) => ({
              id: question.id,
              question: question.question,
              choices: (question.choices as string[] | null) ?? null,
              order: question.order,
            }))}
          />
        </div>
      )}

      <Link
        href={`/dashboard/etudiant/memoires/${memoire.id}`}
        className="mt-10 inline-block text-sm font-medium text-accent hover:underline"
      >
        ← Retour au mémoire
      </Link>
    </>
  );
}
