// src/app/dashboard/etudiant/memoires/[id]/audit/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { ScoreBar } from "@/components/dashboard/ScoreBar";
import type { AuditRecommendation } from "@/lib/audit";

const CATEGORY_LABELS: Record<AuditRecommendation["category"], string> = {
  structure: "Structure",
  coherence: "Cohérence",
  writing_quality: "Qualité rédactionnelle",
  general: "Général",
};

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
      <Breadcrumb
        items={[
          { label: "Mes mémoires", href: "/dashboard/etudiant/memoires" },
          { label: memoire.title, href: `/dashboard/etudiant/memoires/${memoire.id}` },
          { label: "Audit" },
        ]}
      />

      <DashboardHeader
        eyebrow="Rapport d'audit"
        title={memoire.title}
        description="Évaluation générée par IA de la structure, de la cohérence et de la qualité rédactionnelle de votre mémoire."
      />

      <div className="mt-10 rounded-2xl border border-border-dark/10 bg-surface-light p-8">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">Note globale</span>
          <span className="font-serif text-3xl font-normal tracking-[-0.01em] text-ink">
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
    </>
  );
}
