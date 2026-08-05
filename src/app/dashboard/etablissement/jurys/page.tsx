import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreateJuryAccountModal } from "@/components/dashboard/CreateJuryAccountModal";
import { JurysListSection } from "@/components/dashboard/JurysListSection";
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

  const jurySummaries = jurors.map((jury) => ({
    ...jury,
    assignedCount: (workload.get(jury.id) ?? []).length,
  }));

  return (
    <>
      <DashboardHeader
        eyebrow="Jurys"
        title="Gestion des jurys"
        description="Les jurys rattachés à votre établissement et les mémoires qui leur sont assignés."
        actions={jurySummaries.length > 0 ? <CreateJuryAccountModal variant="compact" /> : null}
      />

      {jurySummaries.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border-neutral bg-surface-light px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
            <Users size={20} />
          </div>
          <h2 className="mt-5 text-lg font-medium tracking-[-0.01em] text-ink">
            Aucun jury pour le moment
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
            Créez un compte jury pour votre établissement — un mot de passe temporaire sera
            envoyé par email, avec changement obligatoire à la première connexion.
          </p>
          <CreateJuryAccountModal variant="cta" />
        </div>
      ) : (
        <div className="mt-10">
          <JurysListSection jurors={jurySummaries} />
        </div>
      )}
    </>
  );
}
