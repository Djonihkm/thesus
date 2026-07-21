// src/components/dashboard/Topbar.tsx
import { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface TopbarProps {
  userName: string;
  institutionName?: string | null;
  actions?: ReactNode;
}

export function Topbar({ userName, institutionName, actions }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border-dark/10 bg-surface-light px-6 py-4 md:px-10">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-ink">{userName}</span>
        {institutionName && (
          <span className="text-xs text-ink-muted">{institutionName}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <SignOutButton />
      </div>
    </header>
  );
}