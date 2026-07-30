// src/app/dashboard/jury/layout.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReactNode } from "react";

export default async function JuryLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("JURY");

  return (
    <DashboardShell role="JURY" userName={user.name} institutionName={user.institution?.name}>
      {children}
    </DashboardShell>
  );
}
