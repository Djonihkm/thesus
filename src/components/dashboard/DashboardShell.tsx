// src/components/dashboard/DashboardShell.tsx
import { ReactNode } from "react";
import { Role } from "@prisma/client";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardShellProps {
  role: Role;
  userName: string;
  institutionName?: string | null;
  topbarActions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({
  role,
  userName,
  institutionName,
  topbarActions,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-dark">
      <Sidebar role={role} />
      {/* Coin arrondi visible à la jonction avec la sidebar sombre (md+, où elle est visible) —
          le fond du conteneur racine est sombre, donc le petit sillon découpé par le rayon
          se fond avec elle plutôt que de révéler un vide. Pas de rayon en mobile : la sidebar
          y est masquée (drawer), donc rien à raccorder. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden md:rounded-tl-3xl">
        <Topbar
          role={role}
          userName={userName}
          institutionName={institutionName}
          actions={topbarActions}
        />
        <main className="flex-1 overflow-y-auto bg-surface-light px-6 py-10 md:px-10 md:py-14">
          <div className="relative mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}