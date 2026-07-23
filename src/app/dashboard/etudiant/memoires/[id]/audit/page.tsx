// src/app/dashboard/etudiant/memoires/[id]/audit/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { AuditRecommendation } from "@/lib/audit";

const CATEGORY_LABELS: Record<AuditRecommendation["category"], string> = {
  structure: "Structure",
  coherence: "Cohérence",
  writing_quality: "Qualité rédactionnelle",
  general: "Général",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.max(0, Math.min(100, (value / 20) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        <span className="text-sm font-medium text-ink">{value.toFixed(1)}/20</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-neutral">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default async function AuditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

  const memoire = await prisma.memoire.findUnique({
    where: { id },
    include: { auditReport: true },
  });

  if (!memoire || memoire.studentId !== user.id) {
    notFound();
  }

  if (!memoire.auditReport) {
    redirect(`/dashboard/etudiant/memoires/${memoire.id}`);
  }

  const report = memoire.auditReport;
  const recommendations = (report.recommendations as unknown as AuditRecommendation[]) ?? [];

  return (
    <>
      <DashboardHeader
        eyebrow="Rapport d'audit"
        title={memoire.title}
        description="Évaluation générée par IA de la structure, de la cohérence et de la qualité rédactionnelle de votre mémoire."
      />

      <div className="mt-10 rounded-2xl border border-border-dark/10 bg-surface-light p-8">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium tracking-wide text-accent">Note globale</span>
          <span className="text-3xl font-medium tracking-[-0.01em] text-ink">
            {report.score.toFixed(1)}/20
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          <ScoreBar label="Structure" value={report.structureScore} />
          <ScoreBar label="Cohérence" value={report.coherenceScore} />
          <ScoreBar label="Qualité rédactionnelle" value={report.writingQualityScore} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Recommandations</h2>
        <div className="mt-5 flex flex-col gap-3">
          {recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border-dark/10 bg-surface-light p-5"
            >
              <span className="text-xs font-medium tracking-wide text-accent">
                {CATEGORY_LABELS[recommendation.category] ?? "Général"}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-ink">{recommendation.message}</p>
            </div>
          ))}
        </div>
      </div>

      <Link
        href={`/dashboard/etudiant/memoires/${memoire.id}`}
        className="mt-8 inline-block text-sm font-medium text-accent hover:underline"
      >
        ← Retour au mémoire
      </Link>
    </>
  );
}
