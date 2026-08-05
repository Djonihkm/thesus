"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { requestThemeAction, proposeThemeAction } from "@/lib/actions/themes";
import { ToggleableListing } from "./ToggleableListing";
import type { AvailableTheme, PendingThemeSelection, StudentThemeRequest } from "@/lib/student-theme";

interface ThemeBrowserProps {
  availableThemes: AvailableTheme[];
  pendingSelection: PendingThemeSelection | null;
  myRequests: StudentThemeRequest[];
}

// Ligne de méta unique (point de couleur + libellé), plutôt que d'empiler un badge par état
// (proposition ET demande peuvent coexister sur un même thème) — la ligne principale reflète
// l'état le plus "actionnable" (demande de sélection avant proposition, elle-même avant rien),
// une éventuelle seconde ligne apporte le contexte restant.
function requestMeta(request: StudentThemeRequest): { dot: string; primary: string; secondary?: string } {
  if (request.isCurrent) {
    return { dot: "bg-ink", primary: "Thème actif" };
  }
  if (request.selection) {
    const isPending = request.selection.status === "PENDING";
    return {
      dot: isPending ? "bg-accent" : "bg-flag",
      primary: isPending ? "Demande en attente" : "Demande rejetée",
      secondary:
        request.isOwnProposal && request.proposalStatus === "VALIDATED"
          ? "Votre proposition a été validée"
          : undefined,
    };
  }
  if (request.isOwnProposal && request.proposalStatus) {
    const label =
      request.proposalStatus === "PROPOSED"
        ? "Proposition en attente"
        : request.proposalStatus === "REJECTED"
          ? "Proposition rejetée"
          : "Proposition validée";
    const dot =
      request.proposalStatus === "PROPOSED"
        ? "bg-accent"
        : request.proposalStatus === "REJECTED"
          ? "bg-flag"
          : "bg-ink";
    return { dot, primary: label };
  }
  return { dot: "bg-ink-muted", primary: "" };
}

export function ThemeBrowser({ availableThemes, pendingSelection, myRequests }: ThemeBrowserProps) {
  const [mode, setMode] = useState<"browse" | "propose" | "requests">("browse");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [proposedTitle, setProposedTitle] = useState("");
  const [proposedCategory, setProposedCategory] = useState("");
  const [proposedDescription, setProposedDescription] = useState("");
  const [isProposing, setIsProposing] = useState(false);
  const [proposeSuccess, setProposeSuccess] = useState(false);

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

  // Un étudiant ne peut avoir qu'une seule demande de sélection en attente à la fois (voir
  // requestThemeAction) — tant que pendingSelection est renseigné, tous les boutons
  // "Demander ce thème" restent désactivés, quel que soit le thème affiché.
  const hasPendingRequest = pendingSelection !== null;

  async function handleRequest(themeId: string) {
    setPendingThemeId(themeId);
    setError(null);
    const result = await requestThemeAction(themeId);
    setPendingThemeId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMode("requests");
  }

  async function handlePropose() {
    if (!proposedTitle.trim() || !proposedCategory.trim()) {
      setError("Le titre et la filière sont obligatoires.");
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
    setProposedTitle("");
    setProposedCategory("");
    setProposedDescription("");
    setProposeSuccess(true);
    setMode("requests");
  }

  function requestButtonLabel(themeId: string) {
    if (pendingThemeId === themeId) return "…";
    if (hasPendingRequest) return "Demande en attente";
    return "Demander ce thème";
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
        <button
          type="button"
          onClick={() => setMode("requests")}
          className={`rounded-full px-4 py-2 transition ${mode === "requests" ? "bg-surface-light text-ink shadow-sm" : "text-ink-muted"}`}
        >
          Mes demandes
          {myRequests.length > 0 ? ` (${myRequests.length})` : ""}
        </button>
      </div>

      {error ? (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      ) : null}

      {mode === "browse" ? (
        <div className="mt-6">
          {hasPendingRequest ? (
            <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm text-ink-muted">
              Vous avez une demande en attente pour « {pendingSelection?.theme.title} » — impossible
              de demander un autre thème tant qu&apos;elle n&apos;a pas été traitée.
            </div>
          ) : null}
          {availableThemes.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Aucun thème disponible pour le moment — proposez le vôtre.
            </p>
          ) : (
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
              renderGrid={(theme) => (
                <div className="flex h-full flex-col rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5">
                  <div className="flex-1">
                    <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
                      {theme.category}
                    </span>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-ink">{theme.title}</p>
                    {theme.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                        {theme.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRequest(theme.id)}
                    disabled={pendingThemeId !== null || hasPendingRequest}
                    className="mt-4 self-start rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {requestButtonLabel(theme.id)}
                  </button>
                </div>
              )}
              renderList={(theme) => (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5">
                  <div className="min-w-0">
                    <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
                      {theme.category}
                    </span>
                    <p className="mt-1 line-clamp-1 text-sm font-medium text-ink">{theme.title}</p>
                    {theme.description ? (
                      <p className="mt-1 line-clamp-1 text-sm leading-relaxed text-ink-muted">{theme.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRequest(theme.id)}
                    disabled={pendingThemeId !== null || hasPendingRequest}
                    className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {requestButtonLabel(theme.id)}
                  </button>
                </div>
              )}
            />
          )}
        </div>
      ) : null}

      {mode === "propose" ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5">
          {proposeSuccess ? (
            <p className="text-sm text-ink-muted">
              Votre thème a été soumis à l&apos;établissement — suivez son statut dans « Mes
              demandes ».
            </p>
          ) : null}
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
              Filière / domaine
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
      ) : null}

      {mode === "requests" ? (
        <div className="mt-6 flex flex-col gap-3">
          {myRequests.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Vous n&apos;avez ni proposé ni demandé de thème pour le moment.
            </p>
          ) : (
            myRequests.map((request) => {
              const canRequestOwnProposal =
                request.isOwnProposal &&
                request.proposalStatus === "VALIDATED" &&
                !request.selection &&
                !request.isCurrent;
              const meta = requestMeta(request);
              return (
                <div
                  key={request.theme.id}
                  className="rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5"
                >
                  <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
                    {request.theme.category}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-ink">{request.theme.title}</p>
                  {request.theme.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                      {request.theme.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-1.5 text-xs">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                    <span className="font-medium text-ink">{meta.primary}</span>
                  </div>
                  {meta.secondary ? (
                    <p className="mt-1 text-xs text-ink-muted">{meta.secondary}</p>
                  ) : null}

                  {canRequestOwnProposal ? (
                    <button
                      type="button"
                      onClick={() => handleRequest(request.theme.id)}
                      disabled={pendingThemeId !== null || hasPendingRequest}
                      className="mt-4 self-start rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requestButtonLabel(request.theme.id)}
                    </button>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
