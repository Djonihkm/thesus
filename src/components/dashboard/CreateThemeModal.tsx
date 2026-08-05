"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Lightbulb, Plus, X } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { createThemeAction } from "@/lib/actions/themes";

interface CreateThemeModalProps {
  // "cta" : gros bloc centré pour l'état vide. "compact" : petit bouton persistant en
  // haut de page (voir DashboardHeader actions).
  variant?: "cta" | "compact";
}

export function CreateThemeModal({ variant = "compact" }: CreateThemeModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await createThemeAction({
      title: String(formData.get("title") ?? ""),
      category: String(formData.get("category") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      {variant === "cta" ? (
        <button
          type="button"
          onClick={openModal}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-ink/85"
        >
          <Lightbulb size={16} />
          Créer un thème
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85"
        >
          <Plus size={15} />
          Créer un thème
        </button>
      )}

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
              onClick={() => !isPending && closeModal()}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-surface-light p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
                    Créer un thème
                  </h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    aria-label="Fermer"
                    className="shrink-0 rounded-full p-1.5 text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form action={handleSubmit} className="mt-4 flex flex-col gap-4">
                  {error ? <FormError message={error} /> : null}

                  <div>
                    <label htmlFor="create-theme-title" className="text-sm font-medium text-ink">
                      Titre du thème
                    </label>
                    <input
                      id="create-theme-title"
                      name="title"
                      required
                      className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                      placeholder="Ex. Optimisation des systèmes distribués"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-theme-category" className="text-sm font-medium text-ink">
                      Filière / domaine
                    </label>
                    <input
                      id="create-theme-category"
                      name="category"
                      required
                      className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                      placeholder="Ex. Systèmes distribués"
                    />
                    <p className="mt-1.5 text-xs text-ink-muted">
                      Utilisée pour suggérer un jury dont la spécialité correspond.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="create-theme-description" className="text-sm font-medium text-ink">
                      Description (optionnel)
                    </label>
                    <textarea
                      id="create-theme-description"
                      name="description"
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                    />
                  </div>

                  <div className="mt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isPending}
                      className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-neutral disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? "Création…" : "Créer le thème"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
