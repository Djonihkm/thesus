"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Institution {
  id: string;
  name: string;
}

interface InstitutionComboboxProps {
  label: string;
  institutions: Institution[];
}

const MAX_SUGGESTIONS = 8;

export function InstitutionCombobox({ label, institutions }: InstitutionComboboxProps) {
  const [institutionId, setInstitutionId] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [freeText, setFreeText] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = institutionName.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!query) return [];
    return institutions
      .filter((institution) => institution.name.toLowerCase().includes(query))
      .slice(0, MAX_SUGGESTIONS);
  }, [query, institutions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (freeText) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm text-ink-muted">{label}</label>
        <input
          type="text"
          name="institutionName"
          value={institutionName}
          onChange={(event) => setInstitutionName(event.target.value)}
          className="rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent"
        />
        <button
          type="button"
          onClick={() => {
            setFreeText(false);
            setInstitutionName("");
            setInstitutionId("");
          }}
          className="self-start text-xs text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Choisir dans la liste
        </button>
        <input type="hidden" name="institutionId" value="" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-2" ref={containerRef}>
      <label className="text-sm text-ink-muted">{label}</label>
      <input
        type="text"
        name="institutionName"
        value={institutionName}
        onChange={(event) => {
          setInstitutionName(event.target.value);
          setInstitutionId("");
          setIsOpen(true);
        }}
        placeholder="Rechercher votre établissement…"
        autoComplete="off"
        className="rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent"
      />
      <input type="hidden" name="institutionId" value={institutionId} />

      {isOpen && query ? (
        <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-ink/10 bg-surface-light shadow-sm">
          {matches.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto py-1">
              {matches.map((institution) => (
                <li key={institution.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setInstitutionId(institution.id);
                      setInstitutionName(institution.name);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-surface-neutral"
                  >
                    {institution.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-ink-muted">Aucun établissement trouvé.</p>
          )}
          <button
            type="button"
            onClick={() => {
              setFreeText(true);
              setInstitutionId("");
            }}
            className="w-full border-t border-ink/10 px-4 py-2 text-left text-sm text-accent hover:bg-surface-neutral"
          >
            Mon établissement n&apos;est pas dans la liste
          </button>
        </div>
      ) : null}
    </div>
  );
}
