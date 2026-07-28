"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface FieldOfStudyComboboxProps {
  label: string;
  options: string[];
  defaultValue?: string;
}

const MAX_SUGGESTIONS = 8;

export function FieldOfStudyCombobox({ label, options, defaultValue = "" }: FieldOfStudyComboboxProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [freeText, setFreeText] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!query) return [];
    return options.filter((option) => option.toLowerCase().includes(query)).slice(0, MAX_SUGGESTIONS);
  }, [query, options]);

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
          name="fieldOfStudy"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
          className="rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent"
        />
        <button
          type="button"
          onClick={() => {
            setFreeText(false);
            setValue("");
          }}
          className="self-start text-xs text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Choisir dans la liste
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-2" ref={containerRef}>
      <label className="text-sm text-ink-muted">{label}</label>
      <input
        type="text"
        name="fieldOfStudy"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setIsOpen(true);
        }}
        placeholder="Rechercher votre filière…"
        autoComplete="off"
        required
        className="rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent"
      />

      {isOpen && query ? (
        <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-ink/10 bg-surface-light shadow-sm">
          {matches.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto py-1">
              {matches.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(option);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-surface-neutral"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-ink-muted">Aucune filière trouvée.</p>
          )}
          <button
            type="button"
            onClick={() => setFreeText(true)}
            className="w-full border-t border-ink/10 px-4 py-2 text-left text-sm text-accent hover:bg-surface-neutral"
          >
            Ma filière n&apos;est pas dans la liste
          </button>
        </div>
      ) : null}
    </div>
  );
}
