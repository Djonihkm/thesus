// src/app/dashboard/etablissement/layout.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReactNode } from "react";

export default async function EtablissementLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("INSTITUTION");
  const initialUnreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <DashboardShell
      role="INSTITUTION"
      userName={user.name}
      institutionName={user.institution?.name}
      initialUnreadCount={initialUnreadCount}
    >
      {children}
    </DashboardShell>
  );
}
