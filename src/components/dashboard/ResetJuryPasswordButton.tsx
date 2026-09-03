"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";
import { resetJuryPasswordAction } from "@/lib/actions/jury-accounts";

export function ResetJuryPasswordButton({ juryId, name }: { juryId: string; name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  function openModal(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setError(null);
    setSuccess(false);
    setIsOpen(true);
  }

  async function handleConfirm() {
    setIsPending(true);
    setError(null);
    const result = await resetJuryPasswordAction(juryId);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Réinitialiser le mot de passe"
        title="Réinitialiser le mot de passe"
        className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
      >
        <KeyRound size={15} />
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
                    Réinitialiser le mot de passe ?
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

                {success ? (
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    Un nouveau mot de passe temporaire a été envoyé par email à « {name} ».
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    « {name} » recevra un nouveau mot de passe temporaire par email et devra en
                    choisir un nouveau à sa prochaine connexion. Son mot de passe actuel cessera
                    de fonctionner.
                  </p>
                )}

                {error ? (
                  <div className="mt-4">
                    <FormError message={error} />
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end gap-3">
                  {success ? (
                    <Button type="button" tone="light" variant="primary" onClick={() => setIsOpen(false)}>
                      Fermer
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        tone="light"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isPending}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        tone="light"
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={isPending}
                      >
                        {isPending ? "Réinitialisation…" : "Réinitialiser"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
