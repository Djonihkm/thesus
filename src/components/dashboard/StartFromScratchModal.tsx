"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { PenLine, X } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { createDraftMemoireAction } from "@/lib/actions/memoires";

// Pré-remplit le titre avec celui du thème actif quand il existe (reste modifiable) — laisse
// le champ vide sinon, cohérent avec le reste du parcours de dépôt désormais découplé du
// thème (accessible avec ou sans thème actif).
export function StartFromScratchModal({ activeThemeTitle }: { activeThemeTitle?: string | null }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [linkToTheme, setLinkToTheme] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function openModal() {
    setError(null);
    setTitle(activeThemeTitle ?? "");
    setLinkToTheme(true);
    setIsOpen(true);
  }

  async function handleSubmit() {
    if (!title.trim() || isPending) return;
    setIsPending(true);
    setError(null);
    const result = await createDraftMemoireAction({ title, linkToActiveTheme: linkToTheme });
    if (result.error || !result.memoireId) {
      setIsPending(false);
      setError(result.error ?? "Une erreur est survenue.");
      return;
    }
    router.push(`/dashboard/etudiant/memoires/${result.memoireId}/document`);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-neutral"
      >
        <PenLine size={15} />
        Commencer à partir de zéro
      </button>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
              onClick={() => !isPending && setIsOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-surface-light p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
                    Nommer votre mémoire
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Fermer"
                    disabled={isPending}
                    className="shrink-0 rounded-full p-1.5 text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Un squelette de départ (introduction, chapitres, conclusion) sera créé — vous
                  pourrez tout modifier dans l&apos;éditeur, avec un assistant IA pour vous aider
                  à co-rédiger.
                </p>

                {error ? (
                  <div className="mt-4">
                    <FormError message={error} />
                  </div>
                ) : null}

                <div className="mt-4">
                  <label htmlFor="draft-title" className="text-sm font-medium text-ink">
                    Titre du mémoire
                  </label>
                  <input
                    id="draft-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    autoFocus
                    className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                    placeholder="Ex. Optimisation des systèmes distribués"
                  />
                </div>

                {activeThemeTitle ? (
                  <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-border-neutral bg-surface-neutral/60 px-4 py-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={linkToTheme}
                      onChange={(event) => setLinkToTheme(event.target.checked)}
                      className="mt-0.5"
                    />
                    <span>Lier ce mémoire à mon thème actif « {activeThemeTitle} »</span>
                  </label>
                ) : null}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isPending}
                    className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-neutral disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || !title.trim()}
                    className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Création…" : "Créer et ouvrir l'éditeur"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
