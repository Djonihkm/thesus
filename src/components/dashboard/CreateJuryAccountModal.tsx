"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, X } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { createJuryAccountAction } from "@/lib/actions/jury-accounts";

interface CreateJuryAccountModalProps {
  // "cta" : gros bloc centré pour l'état vide. "compact" : petit bouton persistant en
  // haut de page (voir DashboardHeader actions).
  variant?: "cta" | "compact";
}

export function CreateJuryAccountModal({ variant = "compact" }: CreateJuryAccountModalProps) {
  const router = useRouter();
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

  function openModal() {
    setError(null);
    setSuccess(false);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    if (success) router.refresh();
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await createJuryAccountAction({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      specialty: String(formData.get("specialty") ?? ""),
    });
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <>
      {variant === "cta" ? (
        <button
          type="button"
          onClick={openModal}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-ink/85"
        >
          <UserPlus size={16} />
          Créer un compte jury
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85"
        >
          <Plus size={15} />
          Créer un compte jury
        </button>
      )}

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
              onClick={closeModal}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-surface-light p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
                    Créer un compte jury
                  </h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Fermer"
                    className="shrink-0 rounded-full p-1.5 text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>

                {success ? (
                  <div className="mt-4 flex flex-col gap-4">
                    <p className="text-sm leading-relaxed text-ink">
                      Compte créé — les identifiants de connexion ont été envoyés par email. Un
                      changement de mot de passe sera demandé à la première connexion.
                    </p>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="self-start rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <form action={handleSubmit} className="mt-4 flex flex-col gap-4">
                    <p className="text-sm leading-relaxed text-ink-muted">
                      Un mot de passe temporaire est généré et envoyé par email ; un changement
                      de mot de passe sera demandé à la première connexion.
                    </p>

                    {error ? <FormError message={error} /> : null}

                    <div>
                      <label htmlFor="jury-name" className="text-sm font-medium text-ink">
                        Nom complet
                      </label>
                      <input
                        id="jury-name"
                        name="name"
                        required
                        className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                        placeholder="Ex. Dr. Rokibou Sikirou"
                      />
                    </div>

                    <div>
                      <label htmlFor="jury-email" className="text-sm font-medium text-ink">
                        Email
                      </label>
                      <input
                        id="jury-email"
                        name="email"
                        type="email"
                        required
                        className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                        placeholder="jury@exemple.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="jury-specialty" className="text-sm font-medium text-ink">
                        Spécialité / domaine d&apos;expertise
                      </label>
                      <input
                        id="jury-specialty"
                        name="specialty"
                        required
                        className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                        placeholder="Ex. Systèmes distribués"
                      />
                      <p className="mt-1.5 text-xs text-ink-muted">
                        Utilisée pour suggérer ce jury lors de l&apos;assignation des mémoires.
                      </p>
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
                        {isPending ? "Création…" : "Créer le compte"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
