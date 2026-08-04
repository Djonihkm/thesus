"use client";

import { LayoutGrid, List } from "lucide-react";

interface ViewToggleProps {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 rounded-full bg-surface-neutral p-1">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Vue grille"
        aria-pressed={view === "grid"}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
          view === "grid" ? "bg-surface-light text-ink shadow-sm" : "text-ink-muted"
        }`}
      >
        <LayoutGrid size={15} />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="Vue liste"
        aria-pressed={view === "list"}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
          view === "list" ? "bg-surface-light text-ink shadow-sm" : "text-ink-muted"
        }`}
      >
        <List size={15} />
      </button>
    </div>
  );
}
