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
    <div className="flex h-screen overflow-hidden bg-surface-light">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          role={role}
          userName={userName}
          institutionName={institutionName}
          actions={topbarActions}
        />
        <main className="flex-1 overflow-y-auto px-6 py-10 md:px-10 md:py-14">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}