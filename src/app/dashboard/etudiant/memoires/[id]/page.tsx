// src/app/dashboard/etudiant/memoires/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Loader2, FileEdit } from "lucide-react";
import { AuditIcon, PlagiarismIcon, QuizIcon, JuryIcon } from "@/components/icons";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { MemoireStatusBadge } from "@/components/dashboard/MemoireStatusBadge";
import { AttachThemeButton } from "@/components/dashboard/AttachThemeButton";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { FormError } from "@/components/auth/FormError";
import type { ServiceStatus } from "@/lib/dashboard-types";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function MemoireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

  const memoire = await prisma.memoire.findUnique({
    where: { id },
    include: {
      auditReport: true,
      plagiarismReport: true,
      quiz: { include: { _count: { select: { questions: true } } } },
      jurySimulation: { include: { _count: { select: { questions: true } } } },
      theme: true,
      assignments: {
        orderBy: { assignedAt: "desc" },
        take: 1,
        include: { jury: { select: { name: true } } },
      },
    },
  });

  if (!memoire || memoire.studentId !== user.id) {
    notFound();
  }

  // Un thème actif éventuel — pour proposer de rattacher ce mémoire après coup s'il n'en a
  // pas encore (voir attachCurrentThemeToMemoireAction). Le dépôt lui-même n'a jamais exigé
  // de thème ; ce rattachement ne conditionne que le suivi jury officiel côté établissement.
  const activeTheme = memoire.theme
    ? null
    : ((
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { currentTheme: { select: { title: true } } },
        })
      )?.currentTheme ?? null);

  const assignedJuryName =
    memoire.assignments[0]?.status === "VALIDATED" ? memoire.assignments[0].jury.name : null;

  const auditStatus: ServiceStatus = memoire.auditReport
    ? "done"
    : memoire.status === "FAILED"
      ? "alert"
      : memoire.status === "PROCESSING"
        ? "in_progress"
        : "locked";

  const auditHref = memoire.auditReport
    ? `/dashboard/etudiant/memoires/${memoire.id}/audit`
    : undefined;

  const auditSummary = memoire.auditReport
    ? `${memoire.auditReport.score.toFixed(1)}/20`
    : undefined;

  const plagiarismStatus: ServiceStatus = memoire.plagiarismReport
    ? "done"
    : memoire.status === "FAILED"
      ? "alert"
      : memoire.status === "PROCESSING"
        ? "in_progress"
        : "locked";

  const plagiarismHref = memoire.plagiarismReport
    ? `/dashboard/etudiant/memoires/${memoire.id}/plagiat`
    : undefined;

  const plagiarismSummary = memoire.plagiarismReport
    ? `${memoire.plagiarismReport.similarityScore}% de similarité max.`
    : undefined;

  const isReady = memoire.status === "COMPLETED";
  const isProcessing = memoire.status === "PENDING" || memoire.status === "PROCESSING";

  const quizStatus: ServiceStatus = memoire.quiz ? "done" : isReady ? "available" : "locked";
  const quizHref = isReady ? `/dashboard/etudiant/memoires/${memoire.id}/quiz` : undefined;
  const quizSummary = memoire.quiz
    ? `${memoire.quiz._count.questions} questions`
    : isReady
      ? undefined
      : "Disponible une fois l'audit terminé";

  const juryStatus: ServiceStatus = memoire.jurySimulation
    ? "done"
    : isReady
      ? "available"
      : "locked";
  const juryHref = isReady ? `/dashboard/etudiant/memoires/${memoire.id}/jury` : undefined;
  const jurySummary = memoire.jurySimulation
    ? `${memoire.jurySimulation._count.questions} questions`
    : isReady
      ? undefined
      : "Disponible une fois l'audit terminé";

  return (
    <>
      <AutoRefresh enabled={isProcessing} />

      <Breadcrumb
        items={[
          { label: "Mes mémoires", href: "/dashboard/etudiant/memoires" },
          { label: memoire.title },
        ]}
      />

      <DashboardHeader
        eyebrow={memoire.source === "DRAFTED" ? "Mémoire rédigé en ligne" : "Mémoire déposé"}
        title={memoire.title}
        description={`${memoire.source === "DRAFTED" ? "Créé" : "Déposé"} le ${dateFormatter.format(memoire.submittedAt)}${
          memoire.fileType ? ` · fichier ${memoire.fileType}` : ""
        }${assignedJuryName ? ` · encadré par ${assignedJuryName}` : ""}`}
        actions={<MemoireStatusBadge status={memoire.status} />}
      />

      {memoire.theme ? (
        <div className="mt-8 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5">
          <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            {memoire.theme.category}
          </span>
          <p className="mt-1 text-sm font-medium text-ink">Thème : {memoire.theme.title}</p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border-neutral bg-surface-light p-5">
          <p className="text-sm font-medium text-ink">Aucun thème rattaché</p>
          <p className="mt-1 text-xs text-ink-muted">
            L&apos;analyse (audit, quiz, anti-plagiat, simulation de jury) reste disponible sans
            thème. Un thème rattaché est seulement nécessaire pour l&apos;assignation à un jury
            officiel par votre établissement.
          </p>
          {activeTheme ? (
            <AttachThemeButton memoireId={memoire.id} themeTitle={activeTheme.title} />
          ) : (
            <Link
              href="/dashboard/etudiant/themes"
              className="mt-4 inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-neutral"
            >
              Choisir un thème
            </Link>
          )}
        </div>
      )}

      {isProcessing ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-5 py-4">
          <Loader2 size={18} className="shrink-0 animate-spin text-accent" />
          <div>
            <p className="text-sm font-medium text-ink">
              {memoire.status === "PENDING"
                ? "Extraction du texte en cours…"
                : "Génération du rapport d'audit par l'IA en cours…"}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Cette page se met à jour automatiquement, inutile de recharger.
            </p>
          </div>
        </div>
      ) : null}

      {memoire.status === "FAILED" && memoire.errorMessage ? (
        <div className="mt-8">
          <FormError message={memoire.errorMessage} />
        </div>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ActionCard
          icon={<AuditIcon className="h-5 w-5" />}
          title="Audit de mémoire"
          description="Analyse de structure, cohérence et qualité rédactionnelle."
          status={auditStatus}
          summary={auditSummary}
          href={auditHref}
          ctaLabel="Voir le rapport"
        />
        <ActionCard
          icon={<PlagiarismIcon className="h-5 w-5" />}
          title="Anti-plagiat"
          description="Comparaison sémantique et par empreintes aux mémoires déjà déposés sur la plateforme."
          status={plagiarismStatus}
          summary={plagiarismSummary}
          href={plagiarismHref}
          ctaLabel="Voir le rapport"
        />
        <ActionCard
          icon={<QuizIcon className="h-5 w-5" />}
          title="Quiz personnalisé"
          description="Questions générées à partir du contenu de votre mémoire."
          status={quizStatus}
          summary={quizSummary}
          href={quizHref}
          ctaLabel={memoire.quiz ? "Voir le quiz" : "Générer mon quiz"}
        />
        <ActionCard
          icon={<JuryIcon className="h-5 w-5" />}
          title="Simulation de jury"
          description="Entraînez-vous avec des questions de soutenance ciblées."
          status={juryStatus}
          summary={jurySummary}
          href={juryHref}
          ctaLabel={memoire.jurySimulation ? "Voir les questions" : "Générer les questions"}
        />
        <ActionCard
          icon={<FileEdit size={18} />}
          title="Document"
          description="Éditez votre mémoire en ligne et consultez les annotations du jury."
          status={isReady ? "available" : "locked"}
          href={isReady ? `/dashboard/etudiant/memoires/${memoire.id}/document` : undefined}
          ctaLabel="Ouvrir le document"
        />
      </div>
    </>
  );
}
