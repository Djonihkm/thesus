"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { chooseThemeAction, proposeThemeAction } from "@/lib/actions/themes";
import { ViewToggle } from "./ViewToggle";
import type { AvailableTheme } from "@/lib/student-theme";

interface ThemeBrowserProps {
  availableThemes: AvailableTheme[];
}

export function ThemeBrowser({ availableThemes }: ThemeBrowserProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"browse" | "propose">("browse");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [proposedTitle, setProposedTitle] = useState("");
  const [proposedCategory, setProposedCategory] = useState("");
  const [proposedDescription, setProposedDescription] = useState("");
  const [isProposing, setIsProposing] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(availableThemes.map((theme) => theme.category))).sort(),
    [availableThemes],
  );

  const filteredThemes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return availableThemes.filter((theme) => {
      if (category && theme.category !== category) return false;
      if (!normalizedQuery) return true;
      return (
        theme.title.toLowerCase().includes(normalizedQuery) ||
        theme.category.toLowerCase().includes(normalizedQuery) ||
        (theme.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [availableThemes, query, category]);

  async function handleChoose(themeId: string) {
    setPendingThemeId(themeId);
    setError(null);
    const result = await chooseThemeAction(themeId);
    setPendingThemeId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/etudiant");
  }

  async function handlePropose() {
    if (!proposedTitle.trim() || !proposedCategory.trim()) {
      setError("Le titre et la catégorie sont obligatoires.");
      return;
    }
    setIsProposing(true);
    setError(null);
    const result = await proposeThemeAction({
      title: proposedTitle,
      category: proposedCategory,
      description: proposedDescription,
    });
    setIsProposing(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/etudiant");
  }

  return (
    <div className="mt-8">
      <div className="flex gap-1 rounded-full bg-surface-neutral p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("browse")}
          className={`rounded-full px-4 py-2 transition ${mode === "browse" ? "bg-surface-light text-ink shadow-sm" : "text-ink-muted"}`}
        >
          Parcourir les thèmes
        </button>
        <button
          type="button"
          onClick={() => setMode("propose")}
          className={`rounded-full px-4 py-2 transition ${mode === "propose" ? "bg-surface-light text-ink shadow-sm" : "text-ink-muted"}`}
        >
          Proposer mon thème
        </button>
      </div>

      {error ? (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      ) : null}

      {mode === "browse" ? (
        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un thème par titre, catégorie ou description…"
                className="w-full rounded-lg border border-ink/15 bg-surface-light py-2.5 pr-4 pl-10 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
            </div>
            {categories.length > 1 ? (
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-lg border border-ink/15 bg-surface-light px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : null}
            <ViewToggle view={view} onChange={setView} />
          </div>

          {availableThemes.length === 0 ? (
            <p className="mt-6 text-sm text-ink-muted">
              Aucun thème disponible pour le moment — proposez le vôtre.
            </p>
          ) : filteredThemes.length === 0 ? (
            <p className="mt-6 text-sm text-ink-muted">Aucun thème ne correspond à votre recherche.</p>
          ) : view === "grid" ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredThemes.map((theme) => (
                <div
                  key={theme.id}
                  className="flex h-full flex-col rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5"
                >
                  <div className="flex-1">
                    <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
                      {theme.category}
                    </span>
                    <p className="mt-1 text-sm font-medium text-ink">{theme.title}</p>
                    {theme.description ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                        {theme.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChoose(theme.id)}
                    disabled={pendingThemeId !== null}
                    className="mt-4 self-start rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingThemeId === theme.id ? "…" : "Choisir"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {filteredThemes.map((theme) => (
                <div
                  key={theme.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
                      {theme.category}
                    </span>
                    <p className="mt-1 text-sm font-medium text-ink">{theme.title}</p>
                    {theme.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{theme.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChoose(theme.id)}
                    disabled={pendingThemeId !== null}
                    className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingThemeId === theme.id ? "…" : "Choisir"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5">
          <div>
            <label htmlFor="propose-title" className="text-sm font-medium text-ink">
              Titre du thème
            </label>
            <input
              id="propose-title"
              value={proposedTitle}
              onChange={(event) => setProposedTitle(event.target.value)}
              className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="Ex. Optimisation des systèmes distribués"
            />
          </div>
          <div>
            <label htmlFor="propose-category" className="text-sm font-medium text-ink">
              Catégorie / domaine
            </label>
            <input
              id="propose-category"
              value={proposedCategory}
              onChange={(event) => setProposedCategory(event.target.value)}
              className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="Ex. Systèmes distribués"
            />
          </div>
          <div>
            <label htmlFor="propose-description" className="text-sm font-medium text-ink">
              Description (optionnel)
            </label>
            <textarea
              id="propose-description"
              value={proposedDescription}
              onChange={(event) => setProposedDescription(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={handlePropose}
            disabled={isProposing}
            className="self-start rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProposing ? "Envoi…" : "Proposer ce thème"}
          </button>
        </div>
      )}
    </div>
  );
}
