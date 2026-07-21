// src/app/dashboard/etudiant/layout.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReactNode } from "react";

export default async function EtudiantLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("STUDENT");

  return (
    <DashboardShell
      role="STUDENT"
      userName={user.name}
      institutionName={user.institution?.name}
    >
      {children}
    </DashboardShell>
  );
}