import { ReactNode } from "react";
import { Role } from "@prisma/client";
import { MobileNav } from "./MobileNav";
import { SearchBar } from "./SearchBar";
import { ProfileMenu } from "./ProfileMenu";
import { NotificationsBell } from "./NotificationsBell";

interface TopbarProps {
  role: Role;
  userName: string;
  institutionName?: string | null;
  initialUnreadCount: number;
  actions?: ReactNode;
}

export function Topbar({ role, userName, institutionName, initialUnreadCount, actions }: TopbarProps) {
  return (
    <header className="relative z-10 flex items-center gap-4 border-b border-border-neutral bg-surface-light px-6 py-3.5 shadow-sm shadow-ink/3 md:px-10">
      {/* Filet doré discret en tête de chrome — l'un des rares usages de l'accent hors
          état actif/CTA, pour rythmer la page sans la charger. */}
      <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />

      <MobileNav role={role} />

      <div className="hidden flex-1 md:flex md:justify-center">
        <SearchBar role={role} />
      </div>

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-3">
        {actions}

        <NotificationsBell initialUnreadCount={initialUnreadCount} />

        <span className="hidden h-7 w-px shrink-0 bg-border-neutral sm:block" />

        <ProfileMenu role={role} userName={userName} institutionName={institutionName} />
      </div>
    </header>
  );
}
