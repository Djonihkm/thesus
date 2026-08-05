"use client";

import { useState, type ReactNode } from "react";
import { ViewToggle } from "./ViewToggle";

interface ToggleableListingProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderGrid: (item: T) => ReactNode;
  renderList: (item: T) => ReactNode;
  // Titre optionnel affiché à gauche du toggle (ex. "Tous mes mémoires"). Laisse vide
  // quand le toggle doit simplement s'insérer dans une barre de contrôles existante
  // (recherche, filtres — voir ThemeBrowser).
  title?: string;
  // Contrôles additionnels affichés entre le titre et le toggle (recherche, filtres...).
  headerExtra?: ReactNode;
  gridClassName?: string;
  listClassName?: string;
  defaultView?: "grid" | "list";
  emptyState?: ReactNode;
}

const DEFAULT_GRID_CLASSNAME = "mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
const DEFAULT_LIST_CLASSNAME = "mt-5 flex flex-col gap-3";

// Composant standard pour tout listing de l'application ayant vocation à grandir : gère
// l'état grille/liste (grille par défaut) et les deux rendus, pour ne pas dupliquer cette
// mécanique à chaque nouvelle page de listing (mémoires, thèmes, jurys, et les suivantes).
export function ToggleableListing<T>({
  items,
  getKey,
  renderGrid,
  renderList,
  title,
  headerExtra,
  gridClassName,
  listClassName,
  defaultView = "grid",
  emptyState,
}: ToggleableListingProps<T>) {
  const [view, setView] = useState<"grid" | "list">(defaultView);
  const isEmpty = items.length === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {title ? (
            <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">{title}</h2>
          ) : null}
          {headerExtra}
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {isEmpty && emptyState ? (
        <div className="mt-5">{emptyState}</div>
      ) : view === "grid" ? (
        <div className={gridClassName ?? DEFAULT_GRID_CLASSNAME}>
          {items.map((item) => (
            <div key={getKey(item)}>{renderGrid(item)}</div>
          ))}
        </div>
      ) : (
        <div className={listClassName ?? DEFAULT_LIST_CLASSNAME}>
          {items.map((item) => (
            <div key={getKey(item)}>{renderList(item)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
