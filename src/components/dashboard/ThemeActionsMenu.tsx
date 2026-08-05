"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";

// Menu d'actions discret ("...") ancré en haut à droite d'une card — remplace des icônes
// éparpillées dans le flux de contenu (voir le nettoyage de la card de thème). Positionné en
// absolute dans un wrapper relative plutôt qu'en portal : contrairement aux modales de
// confirmation plein écran, ce menu reste ancré visuellement à son déclencheur, et rien dans
// la grille de cards ne coupe l'overflow qui l'empêcherait de s'afficher.
export function ThemeActionsMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative z-10 shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen ? (
        <div
          role="menu"
          onClick={() => setIsOpen(false)}
          className="absolute top-full right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-border-neutral bg-surface-light py-1 shadow-lg shadow-ink/10"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function ThemeActionsMenuItem({
  icon,
  label,
  onClick,
  disabled,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "accent" | "danger";
}) {
  const toneClassName =
    tone === "danger"
      ? "text-flag hover:bg-flag-soft"
      : tone === "accent"
        ? "text-accent-dark hover:bg-accent/10"
        : "text-ink hover:bg-surface-neutral";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClassName}`}
    >
      {icon}
      {label}
    </button>
  );
}
