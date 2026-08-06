"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { requestThemeClosureAction } from "@/lib/actions/themes";

type ClosureReason = "COMPLETED" | "ABANDONED";

export function CloseThemeModal({ themeId, themeTitle }: { themeId: string; themeTitle: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ClosureReason>("COMPLETED");
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
    setReason("COMPLETED");
    setIsOpen(true);
  }

  async function handleSubmit() {
    setIsPending(true);
    setError(null);
    const result = await requestThemeClosureAction(themeId, reason);
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
        className="shrink-0 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-neutral"
      >
        Clôturer ce thème
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
                    Clôturer « {themeTitle} »
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
                  Cette demande sera soumise à la validation de votre établissement. Le thème
                  reste actif tant qu&apos;elle n&apos;est pas traitée.
                </p>

                {error ? (
                  <div className="mt-4">
                    <FormError message={error} />
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col gap-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      reason === "COMPLETED"
                        ? "border-accent bg-accent/5"
                        : "border-ink/15 hover:bg-surface-neutral"
                    }`}
                  >
                    <input
                      type="radio"
                      name="closure-reason"
                      checked={reason === "COMPLETED"}
                      onChange={() => setReason("COMPLETED")}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">
                        Terminé / soutenu
                      </span>
                      <span className="block text-xs text-ink-muted">
                        Le thème reste définitivement indisponible pour les autres étudiants.
                      </span>
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      reason === "ABANDONED"
                        ? "border-accent bg-accent/5"
                        : "border-ink/15 hover:bg-surface-neutral"
                    }`}
                  >
                    <input
                      type="radio"
                      name="closure-reason"
                      checked={reason === "ABANDONED"}
                      onChange={() => setReason("ABANDONED")}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">Abandon</span>
                      <span className="block text-xs text-ink-muted">
                        Le thème redevient disponible pour un autre étudiant ; vous pourrez en
                        redemander un nouveau.
                      </span>
                    </span>
                  </label>
                </div>

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
                    disabled={isPending}
                    className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Envoi…" : "Soumettre la demande"}
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
