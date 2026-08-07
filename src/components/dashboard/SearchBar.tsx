// src/components/dashboard/SearchBar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Lightbulb, Loader2 } from "lucide-react";
import { Role } from "@prisma/client";
import { searchDashboardAction, type SearchResult } from "@/lib/actions/search";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

const PLACEHOLDER_BY_ROLE: Record<Role, string> = {
  STUDENT: "Rechercher un mémoire, un thème…",
  JURY: "Rechercher un mémoire assigné…",
  INSTITUTION: "Rechercher un mémoire, un thème…",
};

const RESULT_ICON = { memoire: FileText, theme: Lightbulb } as const;

export function SearchBar({ role }: { role: Role }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // La remise à zéro (requête trop courte) est décidée dans handleQueryChange, au moment
  // de la frappe — l'effet ne fait que synchroniser la requête débouncée avec le serveur,
  // et ne touche l'état que depuis le callback du timeout (résultat externe).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }

    const timeout = setTimeout(() => {
      searchDashboardAction(trimmed).then((found) => {
        setResults(found);
        setIsPending(false);
        setHasSearched(true);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setIsOpen(true);

    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setHasSearched(false);
      setIsPending(false);
    } else {
      setIsPending(true);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    router.push(result.href);
    setIsOpen(false);
    setQuery("");
  }

  const showDropdown = isOpen && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search
          size={16}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              event.currentTarget.blur();
            }
          }}
          placeholder={PLACEHOLDER_BY_ROLE[role]}
          aria-label="Rechercher"
          className="w-full rounded-full border border-border-neutral bg-surface-neutral py-2 pr-9 pl-9 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-accent focus:bg-surface-light"
        />
        {isPending ? (
          <Loader2
            size={14}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 animate-spin text-ink-muted"
          />
        ) : null}
      </div>

      {showDropdown ? (
        <div className="absolute top-full left-0 z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border-neutral bg-surface-light py-1.5 shadow-lg shadow-ink/10">
          {results.length > 0 ? (
            results.map((result) => {
              const Icon = RESULT_ICON[result.type];
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-surface-neutral"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-dark">
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {result.title}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {result.subtitle}
                    </span>
                  </span>
                </button>
              );
            })
          ) : hasSearched && !isPending ? (
            <p className="px-3.5 py-3 text-sm text-ink-muted">Aucun résultat</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
