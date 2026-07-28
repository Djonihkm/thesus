// src/app/dashboard/etudiant/memoires/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MemoireCard } from "@/components/dashboard/MemoireCard";
import { MemoireUploadForm } from "@/components/dashboard/MemoireUploadForm";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";

export const maxDuration = 60;

export default async function MemoiresPage() {
  const user = await requireRole("STUDENT");

  const memoires = await prisma.memoire.findMany({
    where: { studentId: user.id },
    orderBy: { submittedAt: "desc" },
  });

  const hasProcessingMemoire = memoires.some(
    (memoire) => memoire.status === "PENDING" || memoire.status === "PROCESSING",
  );

  return (
    <>
      <AutoRefresh enabled={hasProcessingMemoire} />

      <DashboardHeader
        eyebrow="Espace étudiant"
        title="Mes mémoires"
        description="Déposez un mémoire ou consultez le statut de ceux déjà envoyés."
      />

      <div className="mt-10">
        <MemoireUploadForm />
      </div>

      {memoires.length > 0 && (
        <div className="mt-10 flex flex-col gap-3">
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
      )}
    </>
  );
}
