"use client";

import { useMemo, useState } from "react";
import { Check, Lock, Search, X } from "lucide-react";
import { ThemeStatus } from "@prisma/client";
import { ToggleableListing } from "./ToggleableListing";
import { EditThemeModal } from "./EditThemeModal";
import { DeleteThemeButton } from "./DeleteThemeButton";
import { ThemeActionsMenu, ThemeActionsMenuItem } from "./ThemeActionsMenu";
import { validateThemeAction, rejectThemeAction } from "@/lib/actions/themes";

export interface ThemeSummary {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: ThemeStatus;
  proposedByName: string | null;
  takenByName: string | null;
}

const STATUS_DOT: Record<ThemeStatus, string> = {
  PROPOSED: "bg-accent",
  VALIDATED: "bg-ink",
  REJECTED: "bg-flag",
};

const STATUS_LABEL: Record<ThemeStatus, string> = {
  PROPOSED: "En attente",
  VALIDATED: "Validé",
  REJECTED: "Rejeté",
};

// Ligne de méta unique (statut + origine) plutôt que des badges qui s'accumulent et
// wrappent au hasard — un point de couleur pour le statut, du texte simple pour le reste.
// "Pris par X" vit sur sa propre ligne juste en dessous, seulement quand applicable.
function ThemeCardMeta({ theme }: { theme: ThemeSummary }) {
  return (
    <div className="mt-auto pt-3">
      <div className="flex items-center gap-1.5 text-xs">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[theme.status]}`} />
        <span className="font-medium text-ink">{STATUS_LABEL[theme.status]}</span>
        <span className="text-ink-muted">·</span>
        <span className="truncate text-ink-muted">
          {theme.proposedByName ? `Proposé par ${theme.proposedByName}` : "Établissement"}
        </span>
      </div>
      {theme.takenByName ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <Lock size={11} className="shrink-0" />
          <span className="truncate">Pris par {theme.takenByName}</span>
        </div>
      ) : null}
    </div>
  );
}

// Regroupe valider/rejeter/modifier/supprimer dans un seul menu discret ("...") plutôt que
// des icônes éparpillées — valider/rejeter n'apparaissent que pour un thème PROPOSED. L'état
// pending/erreur de valider/rejeter est local à chaque carte ; le menu se ferme tout seul au
// clic (l'event bubble jusqu'au conteneur de ThemeActionsMenu), y compris quand il ouvre une
// modale (Modifier/Supprimer) par-dessus.
function ThemeCardMenu({ theme }: { theme: ThemeSummary }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: (id: string) => Promise<{ error?: string; success?: boolean }>) {
    setIsPending(true);
    setError(null);
    const result = await action(theme.id);
    setIsPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <ThemeActionsMenu>
        {theme.status === "PROPOSED" ? (
          <>
            <ThemeActionsMenuItem
              icon={<Check size={14} />}
              label="Valider"
              tone="accent"
              disabled={isPending}
              onClick={() => handle(validateThemeAction)}
            />
            <ThemeActionsMenuItem
              icon={<X size={14} />}
              label="Rejeter"
              tone="danger"
              disabled={isPending}
              onClick={() => handle(rejectThemeAction)}
            />
            <div className="my-1 border-t border-border-neutral" />
          </>
        ) : null}
        <EditThemeModal
          themeId={theme.id}
          title={theme.title}
          category={theme.category}
          description={theme.description ?? ""}
        />
        <DeleteThemeButton themeId={theme.id} title={theme.title} />
      </ThemeActionsMenu>
      {error ? <p className="max-w-40 text-right text-xs text-flag">{error}</p> : null}
    </div>
  );
}

function ThemeCard({ theme }: { theme: ThemeSummary }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
          {theme.category}
        </span>
        <ThemeCardMenu theme={theme} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-ink">{theme.title}</p>
      {theme.description ? (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {theme.description}
        </p>
      ) : null}
      <ThemeCardMeta theme={theme} />
    </div>
  );
}

export function ThemesListSection({ themes }: { themes: ThemeSummary[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(themes.map((theme) => theme.category))).sort(),
    [themes],
  );

  const filteredThemes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return themes.filter((theme) => {
      if (category && theme.category !== category) return false;
      if (!normalizedQuery) return true;
      return (
        theme.title.toLowerCase().includes(normalizedQuery) ||
        theme.category.toLowerCase().includes(normalizedQuery) ||
        (theme.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [themes, query, category]);

  return (
    <ToggleableListing
      items={filteredThemes}
      getKey={(theme) => theme.id}
      headerExtra={
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un thème par titre, filière ou description…"
              className="w-full rounded-lg border border-ink/15 bg-surface-light py-2.5 pr-4 pl-10 text-sm text-ink outline-none transition-colors focus:border-accent"
            />
          </div>
          {categories.length > 1 ? (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-ink/15 bg-surface-light px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">Toutes les filières</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      }
      emptyState={
        <p className="text-sm text-ink-muted">Aucun thème ne correspond à votre recherche.</p>
      }
      gridClassName="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
      renderGrid={(theme) => (
        <div className="h-full rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-md shadow-ink/8">
          <ThemeCard theme={theme} />
        </div>
      )}
      renderList={(theme) => (
        <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-md shadow-ink/8">
          <ThemeCard theme={theme} />
        </div>
      )}
    />
  );
}
