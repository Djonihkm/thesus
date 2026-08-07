// src/components/dashboard/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Role } from "@prisma/client";
import { getNavForRole, getRoleLabel, isNavItemActive } from "@/lib/dashboard-nav";

interface SidebarProps {
  role: Role;
}

const COLLAPSED_STORAGE_KEY = "thesus-sidebar-collapsed";

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavForRole(role);
  const roleLabel = getRoleLabel(role);

  // Repli mémorisé par utilisateur (localStorage) — lu paresseusement avec garde SSR, même
  // pattern que le repli du panneau latéral de l'éditeur de document.
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  return (
    <aside
      className={`sidebar-dark hidden h-full shrink-0 flex-col overflow-visible py-6 transition-[width] duration-200 md:flex ${
        isCollapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className={`shrink-0 ${isCollapsed ? "px-0" : "px-7"}`}>
        <Link href="/" className={`flex ${isCollapsed ? "justify-center" : ""}`}>
          {isCollapsed ? (
            <Image src="/fav.png" alt="Thesus" width={40} height={40} className="h-9 w-9" />
          ) : (
            <Image
              src="/logo-white.png"
              alt="Thesus"
              width={239}
              height={133}
              className="h-7 w-auto"
            />
          )}
        </Link>
        {!isCollapsed ? (
          <p className="mt-2.5 text-xs font-medium tracking-wide text-paper-muted">
            {roleLabel}
          </p>
        ) : null}
      </div>

      {/* Pas de overflow-y-auto ici : avec overflow-x resté "visible" (nécessaire pour que le
          tooltip replié s'échappe vers la droite), un seul axe en scroll fait passer l'autre
          en "auto" par la spec CSS — d'où la scrollbar horizontale fantôme en mode replié.
          Les listes de nav actuelles (4 à 6 items) ne débordent jamais verticalement. */}
      <nav className={`mt-9 flex flex-1 flex-col gap-1 ${isCollapsed ? "px-3" : "px-4"}`}>
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                aria-label={isCollapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 rounded-xl py-2.5 text-sm transition ${
                  isCollapsed ? "justify-center px-0" : "px-3.5"
                } ${
                  isActive
                    ? "bg-accent/12 font-medium text-accent-on-dark"
                    : "text-paper-muted hover:bg-white/5 hover:text-paper"
                }`}
              >
                {isActive ? (
                  <span className="absolute top-1/2 left-0 h-4 w-1 -translate-y-1/2 rounded-full bg-accent" />
                ) : null}
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.7} className="shrink-0" />
                {isCollapsed ? null : item.label}
              </Link>

              {isCollapsed ? (
                <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-paper opacity-0 shadow-lg shadow-ink/20 transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className={`mt-auto shrink-0 pt-6 ${isCollapsed ? "px-3" : "px-4"}`}>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label={isCollapsed ? "Déplier le menu" : "Réduire le menu"}
          title={isCollapsed ? "Déplier le menu" : "Réduire le menu"}
          className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-xs font-medium text-paper-muted transition hover:bg-white/5 hover:text-paper ${
            isCollapsed ? "justify-center px-0" : "px-3.5"
          }`}
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          {isCollapsed ? null : "Réduire le menu"}
        </button>
      </div>
    </aside>
  );
}
