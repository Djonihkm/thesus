// src/components/dashboard/ProfileMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Role } from "@prisma/client";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getRoleLabel } from "@/lib/dashboard-nav";

interface ProfileMenuProps {
  role: Role;
  userName: string;
  institutionName?: string | null;
}

export function ProfileMenu({ role, userName, institutionName }: ProfileMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const roleLabel = getRoleLabel(role).replace("Espace ", "");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label="Menu du compte"
        className="flex min-w-0 items-center gap-2 rounded-full py-1 pr-2 pl-1 transition hover:bg-surface-neutral"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-serif text-sm text-accent-dark">
          {userName.charAt(0).toUpperCase()}
        </span>

        {/* Nom en priorité, badge de rôle sur sa propre ligne juste en dessous (plutôt que
            collé à côté du nom), établissement en info secondaire — hiérarchie visible
            uniquement à partir de sm, l'avatar seul suffit comme déclencheur en mobile. */}
        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="max-w-[9.5rem] truncate text-sm font-medium text-ink">{userName}</span>
          <span className="mt-0.5 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[9.5px] font-medium tracking-wide text-accent-dark uppercase">
            {roleLabel}
          </span>
        </span>

        <ChevronDown
          size={14}
          className={`hidden shrink-0 text-ink-muted transition-transform sm:block ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border-neutral bg-surface-light py-1.5 shadow-lg shadow-ink/10">
          <div className="px-3.5 py-2.5">
            <p className="truncate text-sm font-medium text-ink">{userName}</p>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent-dark uppercase">
              {roleLabel}
            </span>
            {institutionName ? (
              <p className="mt-1.5 truncate text-xs text-ink-muted">{institutionName}</p>
            ) : null}
          </div>

          <div className="my-1 h-px bg-border-neutral" />

          <SignOutButton />
        </div>
      ) : null}
    </div>
  );
}
