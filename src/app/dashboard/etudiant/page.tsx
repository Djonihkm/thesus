// src/app/dashboard/etudiant/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { FileText, ShieldCheck, ListChecks, Users } from "lucide-react";

export default async function EtudiantDashboardPage() {
  const user = await requireRole("STUDENT");

  return (
    <DashboardShell
      role="STUDENT"
      userName={user.name}
      institutionName={user.institution?.name}
    >
      <DashboardHeader
        eyebrow="Espace étudiant"
        title={`Bonjour ${user.name}`}
        description="Déposez votre mémoire pour débloquer l'audit, l'anti-plagiat, le quiz et la préparation au jury."
      />

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ActionCard
          icon={<FileText size={18} />}
          title="Audit de mémoire"
          description="Analyse de structure, cohérence et qualité rédactionnelle."
          status="locked"
          href="/dashboard/etudiant/audit"
        />
        <ActionCard
          icon={<ShieldCheck size={18} />}
          title="Anti-plagiat"
          description="Comparaison à une base de publications et certificat officiel."
          status="locked"
          href="/dashboard/etudiant/plagiat"
        />
        <ActionCard
          icon={<ListChecks size={18} />}
          title="Quiz personnalisé"
          description="Questions générées à partir du contenu de votre mémoire."
          status="locked"
          href="/dashboard/etudiant/quiz"
        />
        <ActionCard
          icon={<Users size={18} />}
          title="Simulation de jury"
          description="Entraînez-vous avec des questions de soutenance ciblées."
          status="locked"
          href="/dashboard/etudiant/jury"
        />
      </div>
    </DashboardShell>
  );
}