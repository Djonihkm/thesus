// src/components/dashboard/MobileNav.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Role } from "@prisma/client";
import { getNavForRole, getRoleLabel } from "@/lib/dashboard-nav";
import { isNavItemActive } from "@/lib/dashboard-nav";

interface MobileNavProps {
  role: Role;
}

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navItems = getNavForRole(role);
  const roleLabel = getRoleLabel(role);

  // Ferme le drawer automatiquement après un changement de route
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Empêche le scroll du fond quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-surface-neutral md:hidden"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panneau — même traitement sombre que la sidebar desktop (Sidebar.tsx), pour que
              le menu reste visuellement le même produit d'un breakpoint à l'autre. */}
          <div className="sidebar-dark absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col px-5 py-6 shadow-xl">
            <div className="flex items-center justify-between px-2">
              <div>
                <Image
                  src="/logo-white.png"
                  alt="Thesus"
                  width={239}
                  height={133}
                  className="h-7 w-auto"
                />
                <p className="mt-2 text-xs font-medium tracking-wide text-paper-muted">
                  {roleLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-paper-muted hover:bg-white/5 hover:text-paper"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="mt-8 flex flex-1 flex-col gap-1">
              {navItems.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                      isActive
                        ? "bg-accent/12 font-medium text-accent-on-dark"
                        : "text-paper-muted hover:bg-white/5 hover:text-paper"
                    }`}
                  >
                    {isActive ? (
                      <span className="absolute top-1/2 left-0 h-4 w-1 -translate-y-1/2 rounded-full bg-accent" />
                    ) : null}
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.7} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}