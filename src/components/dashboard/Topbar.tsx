// src/components/dashboard/Topbar.tsx
import { ReactNode } from "react";
import { Role } from "@prisma/client";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MobileNav } from "./MobileNav";

interface TopbarProps {
  role: Role;
  userName: string;
  institutionName?: string | null;
  actions?: ReactNode;
}

export function Topbar({ role, userName, institutionName, actions }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border-dark/10 bg-surface-light px-6 py-4 md:px-10">
      <div className="flex items-center gap-3">
        <MobileNav role={role} />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-serif text-sm text-accent-dark">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-ink">{userName}</span>
          {institutionName && (
            <span className="text-xs text-ink-muted">{institutionName}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <SignOutButton />
      </div>
    </header>
  );
}