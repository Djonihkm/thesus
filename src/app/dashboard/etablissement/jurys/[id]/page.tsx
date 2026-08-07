import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { MemoireStatusBadge } from "@/components/dashboard/MemoireStatusBadge";
import { getInstitutionJuryWorkload } from "@/lib/jury-workload";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function EtablissementJuryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("INSTITUTION");

  if (!user.institutionId) {
    notFound();
  }

  const jury = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      specialty: true,
      juryFunction: true,
      institutionId: true,
      role: true,
    },
  });

  if (!jury || jury.role !== "JURY" || jury.institutionId !== user.institutionId) {
    notFound();
  }

  const workload = await getInstitutionJuryWorkload(user.institutionId);
  const assigned = workload.get(jury.id) ?? [];

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Jurys", href: "/dashboard/etablissement/jurys" },
          { label: jury.name },
        ]}
      />

      <DashboardHeader
        eyebrow="Jurys"
        title={jury.name}
        description={jury.specialty ?? "Spécialité non renseignée"}
      />

      <h2 className="mt-10 text-lg font-medium tracking-[-0.01em] text-ink">
        Mémoires assignés ({assigned.length})
      </h2>

      {assigned.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">Aucun mémoire assigné à ce jury pour le moment.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {assigned.map((memoire) => (
            <div
              key={memoire.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-md shadow-ink/8"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{memoire.title}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {memoire.studentName} · déposé le {dateFormatter.format(memoire.submittedAt)}
                </p>
              </div>
              <MemoireStatusBadge status={memoire.status} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
