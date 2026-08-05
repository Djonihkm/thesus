"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";
import { deleteThemeAction } from "@/lib/actions/themes";

export function DeleteThemeButton({ themeId, title }: { themeId: string; title: string }) {
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

  async function handleConfirm() {
    setIsPending(true);
    setError(null);
    const result = await deleteThemeAction(themeId);
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
      <button
        type="button"
        onClick={openModal}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-flag transition hover:bg-flag-soft"
      >
        <Trash2 size={14} />
        Supprimer
      </button>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
              onClick={() => !isPending && setIsOpen(false)}
            >
              <div
                className="w-full max-w-sm rounded-2xl bg-surface-light p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
                    Supprimer ce thème ?
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
                  Le thème « {title} » sera définitivement supprimé. Cette action est
                  irréversible.
                </p>

                {error ? (
                  <div className="mt-4">
                    <FormError message={error} />
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    tone="light"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isPending}
                  >
                    Annuler
                  </Button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="rounded-full bg-flag px-7 py-3 text-sm font-medium text-paper transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Suppression…" : "Supprimer définitivement"}
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
