import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MemoireStatusBadge } from "@/components/dashboard/MemoireStatusBadge";
import { AssignJuryControl } from "@/components/dashboard/AssignJuryControl";
import { suggestJurorsForCategory } from "@/lib/jury-assignment";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function EtablissementMemoiresPage() {
  const user = await requireRole("INSTITUTION");

  if (!user.institutionId) {
    return (
      <DashboardHeader
        eyebrow="Mémoires"
        title="Bibliothèque de mémoires"
        description="Votre établissement n'est pas encore rattaché à la plateforme."
      />
    );
  }

  const institutionId = user.institutionId;

  const [memoires, jurors] = await Promise.all([
    prisma.memoire.findMany({
      where: { institutionId },
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { name: true } },
        theme: true,
        assignments: {
          orderBy: { assignedAt: "desc" },
          take: 1,
          include: { jury: { select: { name: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { institutionId, role: "JURY" },
      select: { id: true, name: true, specialty: true },
    }),
  ]);

  return (
    <>
      <DashboardHeader
        eyebrow="Mémoires"
        title="Bibliothèque de mémoires"
        description="Thème, statut et jury assigné pour chaque mémoire déposé dans votre établissement."
      />

      {memoires.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">Aucun mémoire déposé pour le moment.</p>
      ) : (
        <div className="mt-10 flex flex-col gap-3">
          {memoires.map((memoire) => {
            const currentAssignment = memoire.assignments[0];
            const isValidated = currentAssignment?.status === "VALIDATED";
            const suggestions =
              !isValidated && memoire.theme?.status === "VALIDATED"
                ? suggestJurorsForCategory(memoire.theme.category, jurors)
                : [];

            return (
              <div
                key={memoire.id}
                className="flex flex-col gap-4 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{memoire.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {memoire.student.name} · déposé le {dateFormatter.format(memoire.submittedAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <MemoireStatusBadge status={memoire.status} />
                    {memoire.theme ? (
                      <span className="inline-flex items-center rounded-full bg-surface-neutral px-3 py-1 text-xs font-medium text-ink-muted">
                        {memoire.theme.title}
                        {memoire.theme.status !== "VALIDATED"
                          ? ` (${memoire.theme.status === "PROPOSED" ? "en attente" : "rejeté"})`
                          : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-surface-neutral px-3 py-1 text-xs font-medium text-ink-muted">
                        Aucun thème
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isValidated ? (
                    <span className="text-sm font-medium text-ink">
                      Assigné à {currentAssignment.jury.name}
                    </span>
                  ) : memoire.theme?.status === "VALIDATED" ? (
                    <AssignJuryControl memoireId={memoire.id} jurors={suggestions} />
                  ) : memoire.theme ? (
                    <span className="text-xs text-ink-muted">
                      Thème en attente de validation
                    </span>
                  ) : (
                    <span className="text-xs text-ink-muted">
                      Aucun thème rattaché — assignation indisponible
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
