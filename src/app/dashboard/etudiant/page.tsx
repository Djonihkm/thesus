// src/app/dashboard/etudiant/page.tsx
import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { MemoireCard } from "@/components/dashboard/MemoireCard";
import { MemoireUploadForm } from "@/components/dashboard/MemoireUploadForm";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { Button } from "@/components/ui/Button";
import { FileText, ShieldCheck, ListChecks, Users } from "lucide-react";

const RECENT_MEMOIRES_LIMIT = 3;

export default async function EtudiantDashboardPage() {
  const user = await requireRole("STUDENT");

  const memoires = await prisma.memoire.findMany({
    where: { studentId: user.id },
    orderBy: { submittedAt: "desc" },
    take: RECENT_MEMOIRES_LIMIT,
  });

  const hasProcessingMemoire = memoires.some(
    (memoire) => memoire.status === "PENDING" || memoire.status === "PROCESSING",
  );

  return (
    <>
      <AutoRefresh enabled={hasProcessingMemoire} />

      <DashboardHeader
        eyebrow="Espace étudiant"
        title={`Bonjour ${user.name}`}
        description="Déposez votre mémoire pour débloquer l'audit, l'anti-plagiat, le quiz et la préparation au jury."
      />

      <div className="mt-12">
        {memoires.length === 0 ? (
          <MemoireUploadForm />
        ) : (
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
                Mes derniers mémoires
              </h2>
              <Button
                href="/dashboard/etudiant/memoires"
                variant="outline"
                tone="light"
                className="text-sm"
              >
                Voir tous mes mémoires
              </Button>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {memoires.map((memoire) => (
                <MemoireCard
                  key={memoire.id}
                  id={memoire.id}
                  title={memoire.title}
                  status={memoire.status}
                  submittedAt={memoire.submittedAt}
                />
              ))}
            </div>
            <Link
              href="/dashboard/etudiant/memoires"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Déposer un nouveau mémoire →
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
          Ce que vous pourrez faire une fois votre mémoire traité
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ActionCard
            icon={<FileText size={18} />}
            title="Audit de mémoire"
            description="Analyse de structure, cohérence et qualité rédactionnelle."
            status="locked"
          />
          <ActionCard
            icon={<ShieldCheck size={18} />}
            title="Anti-plagiat"
            description="Comparaison à une base de publications et certificat officiel."
            status="locked"
          />
          <ActionCard
            icon={<ListChecks size={18} />}
            title="Quiz personnalisé"
            description="Questions générées à partir du contenu de votre mémoire."
            status="locked"
          />
          <ActionCard
            icon={<Users size={18} />}
            title="Simulation de jury"
            description="Entraînez-vous avec des questions de soutenance ciblées."
            status="locked"
          />
        </div>
      </div>
    </>
  );
}
