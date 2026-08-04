import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getInstitutionJuryWorkload } from "@/lib/jury-workload";

export default async function EtablissementJurysPage() {
  const user = await requireRole("INSTITUTION");

  if (!user.institutionId) {
    return (
      <DashboardHeader
        eyebrow="Jurys"
        title="Gestion des jurys"
        description="Votre établissement n'est pas encore rattaché à la plateforme."
      />
    );
  }

  const institutionId = user.institutionId;

  const [jurors, workload] = await Promise.all([
    prisma.user.findMany({
      where: { institutionId, role: "JURY" },
      select: { id: true, name: true, specialty: true, juryFunction: true },
      orderBy: { name: "asc" },
    }),
    getInstitutionJuryWorkload(institutionId),
  ]);

  return (
    <>
      <DashboardHeader
        eyebrow="Jurys"
        title="Gestion des jurys"
        description="Les jurys rattachés à votre établissement et les mémoires qui leur sont assignés."
      />

      {jurors.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">
          Aucun jury rattaché à votre établissement pour le moment. L&apos;inscription d&apos;un
          jury se fait via le parcours d&apos;inscription standard.
        </p>
      ) : (
        <div className="mt-10 flex flex-col gap-3">
          {jurors.map((jury) => {
            const assigned = workload.get(jury.id) ?? [];
            return (
              <Link
                key={jury.id}
                href={`/dashboard/etablissement/jurys/${jury.id}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{jury.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {jury.specialty ?? "Spécialité non renseignée"}
                    {jury.juryFunction === "ENSEIGNANT" ? " · Enseignant" : ""}
                    {jury.juryFunction === "PROFESSIONNEL" ? " · Professionnel" : ""}
                  </p>
                </div>
                <span className="shrink-0 text-right font-serif text-2xl font-normal text-accent-dark">
                  {assigned.length}
                  <span className="ml-1.5 text-xs font-sans font-medium text-ink-muted">
                    mémoire{assigned.length > 1 ? "s" : ""}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
