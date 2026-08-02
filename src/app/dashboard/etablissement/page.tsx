import { requireRole } from "@/lib/auth-guard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function EtablissementDashboardPage() {
  const user = await requireRole("INSTITUTION");

  return (
    <DashboardHeader
      eyebrow="Espace établissement"
      title={`Bonjour ${user.name}`}
      description="L'import des étudiants et la vue d'ensemble sur les soutenances à venir arriveront bientôt dans cet espace."
    />
  );
}
