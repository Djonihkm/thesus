// src/app/dashboard/jury/memoires/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MemoireEvaluationRow } from "@/components/dashboard/MemoireEvaluationRow";

export default async function JuryMemoiresPage() {
  const user = await requireRole("JURY");

  const memoires = user.institutionId
    ? await prisma.memoire.findMany({
        where: {
          institutionId: user.institutionId,
          status: "COMPLETED",
          OR: [
            { assignments: { some: { juryId: user.id, status: "VALIDATED" } } },
            { evaluations: { some: { juryId: user.id } } },
          ],
        },
        orderBy: { submittedAt: "desc" },
        include: {
          student: { select: { name: true } },
          evaluations: { where: { juryId: user.id } },
        },
      })
    : [];

  return (
    <>
      <DashboardHeader
        eyebrow="Mémoires à évaluer"
        title="Mémoires prêts pour soutenance"
        description="Les mémoires qui vous sont assignés, prêts pour soutenance."
      />

      {memoires.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">
          Aucun mémoire ne vous est assigné pour le moment.
        </p>
      ) : (
        <div className="mt-10 flex flex-col gap-3">
          {memoires.map((memoire) => (
            <MemoireEvaluationRow
              key={memoire.id}
              id={memoire.id}
              title={memoire.title}
              studentName={memoire.student.name}
              submittedAt={memoire.submittedAt}
              isEvaluated={memoire.evaluations.length > 0}
            />
          ))}
        </div>
      )}
    </>
  );
}
