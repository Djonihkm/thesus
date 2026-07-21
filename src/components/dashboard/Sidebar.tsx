// src/components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { getNavForRole, getRoleLabel } from "@/lib/dashboard-nav";

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavForRole(role);
  const roleLabel = getRoleLabel(role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border-dark/10 bg-surface-light px-5 py-8 md:flex">
      <div className="px-2">
        <span className="text-lg font-medium tracking-[-0.01em] text-ink">
          Thesus
        </span>
        <p className="mt-1 text-xs font-medium tracking-wide text-ink-muted">
          {roleLabel}
        </p>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== pathname && pathname.startsWith(`${item.href}/`));
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