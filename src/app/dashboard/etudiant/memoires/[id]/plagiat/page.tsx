// src/app/dashboard/etudiant/memoires/[id]/plagiat/page.tsx
import { notFound, redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { PlagiarismPassages } from "@/components/dashboard/PlagiarismPassages";
import { RecomputePlagiarismButton } from "@/components/dashboard/RecomputePlagiarismButton";
import type { PlagiarismMatch } from "@/lib/plagiarism";

export default async function PlagiarismReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

  const memoire = await prisma.memoire.findUnique({
    where: { id },
    include: { plagiarismReport: true },
  });

  if (!memoire || memoire.studentId !== user.id) {
    notFound();
  }

  if (!memoire.plagiarismReport) {
    redirect(`/dashboard/etudiant/memoires/${memoire.id}`);
  }

  const report = memoire.plagiarismReport;
  const matches = (report.matches as unknown as PlagiarismMatch[]) ?? [];
  const isClean = report.similarityScore < 15;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Mes mémoires", href: "/dashboard/etudiant/memoires" },
          { label: memoire.title, href: `/dashboard/etudiant/memoires/${memoire.id}` },
          { label: "Anti-plagiat" },
        ]}
      />

      <DashboardHeader
        eyebrow="Rapport anti-plagiat"
        title={memoire.title}
        description="Comparaison sémantique et par empreintes textuelles aux autres mémoires déposés sur la plateforme."
        actions={<RecomputePlagiarismButton memoireId={memoire.id} />}
      />

      <div className="mt-10 flex items-center gap-4 rounded-2xl border border-border-dark/10 bg-surface-light p-8">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            isClean ? "bg-accent/10 text-accent" : "bg-flag-soft text-flag"
          }`}
        >
          {isClean ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
        </div>
        <div>
          <span className="text-sm font-medium tracking-wide text-ink-muted">
            Similarité maximale détectée
          </span>
          <p className="mt-1 font-serif text-3xl font-normal tracking-[-0.01em] text-ink">
            {report.similarityScore}%
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
          Mémoires similaires
        </h2>
        {matches.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Aucune similarité significative détectée avec les mémoires déjà déposés sur la
            plateforme.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {matches.map((match) => (
              <div
                key={match.memoireId}
                className="rounded-2xl border border-border-dark/10 bg-surface-light p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-ink">{match.title}</span>
                  <span className="shrink-0 text-sm font-medium text-ink">{match.score}%</span>
                </div>

                {match.passages && match.passages.length > 0 ? (
                  <PlagiarismPassages passages={match.passages} />
                ) : match.passages === undefined ? (
                  <p className="mt-3 border-t border-border-dark/10 pt-3 text-xs text-ink-muted">
                    Détail des passages non disponible — ce rapport a été généré avant l&apos;ajout
                    de cette fonctionnalité. Relancez l&apos;analyse ci-dessus pour le mettre à
                    jour.
                  </p>
                ) : match.passagesUnavailable ? (
                  <p className="mt-3 border-t border-border-dark/10 pt-3 text-xs text-ink-muted">
                    Détail des passages non disponible : « {match.title} » n&apos;a pas encore été
                    réanalysé avec cette granularité. Ouvrez son propre rapport et relancez son
                    analyse pour débloquer le détail ici aussi.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
