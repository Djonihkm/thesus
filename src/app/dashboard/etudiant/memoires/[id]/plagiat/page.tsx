// src/app/dashboard/etudiant/memoires/[id]/plagiat/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
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
      <DashboardHeader
        eyebrow="Rapport anti-plagiat"
        title={memoire.title}
        description="Comparaison sémantique et par empreintes textuelles aux autres mémoires déposés sur la plateforme."
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
                className="flex items-center justify-between rounded-2xl border border-border-dark/10 bg-surface-light p-5"
              >
                <span className="text-sm text-ink">{match.title}</span>
                <span className="text-sm font-medium text-ink">{match.score}%</span>
              </div>
            ))}
          </div>
        )}
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
