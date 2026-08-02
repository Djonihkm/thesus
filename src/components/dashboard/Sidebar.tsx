// src/components/dashboard/Sidebar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { getNavForRole, getRoleLabel } from "@/lib/dashboard-nav";
import { isNavItemActive } from "@/lib/dashboard-nav";

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavForRole(role);
  const roleLabel = getRoleLabel(role);

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border-dark/10 bg-surface-light px-5 py-8 md:flex">
      <div className="px-2">
        <Link href="/" className="inline-flex">
          <Image src="/logo.png" alt="Thesus" width={239} height={133} className="h-7 w-auto" />
        </Link>
        <p className="mt-2 text-xs font-medium tracking-wide text-ink-muted">
          {roleLabel}
        </p>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-surface-neutral font-medium text-ink"
                  : "text-ink-muted hover:bg-surface-neutral/60 hover:text-ink"
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-6 text-xs text-ink-muted">
        <span className="text-accent">●</span> Thesus
      </div>
    </aside>
  );
}