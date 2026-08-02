// src/app/dashboard/etablissement/layout.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReactNode } from "react";

export default async function EtablissementLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("INSTITUTION");

  return (
    <DashboardShell
      role="INSTITUTION"
      userName={user.name}
      institutionName={user.institution?.name}
    >
      {children}
    </DashboardShell>
  );
}
