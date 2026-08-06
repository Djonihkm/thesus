// src/components/dashboard/Breadcrumb.tsx
//
// Fil d'Ariane générique pour les pages imbriquées du dashboard (détail d'un mémoire, d'un
// jury, et leurs sous-pages) — placé en premier, avant DashboardHeader, sur chaque page à
// plus d'un niveau sous la racine de son dashboard. Le dernier segment (page courante) n'est
// jamais un lien.
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight size={14} className="text-ink-muted/50" /> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="text-ink-muted transition hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "max-w-56 truncate font-medium text-ink sm:max-w-xs"
                    : "text-ink-muted"
                }
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
