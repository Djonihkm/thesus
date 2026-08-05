"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { updateJuryAccountAction } from "@/lib/actions/jury-accounts";

interface EditJuryAccountModalProps {
  juryId: string;
  name: string;
  specialty: string;
}

export function EditJuryAccountModal({ juryId, name, specialty }: EditJuryAccountModalProps) {
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

  function openModal(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setError(null);
    setIsOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await updateJuryAccountAction(juryId, {
      name: String(formData.get("name") ?? ""),
      specialty: String(formData.get("specialty") ?? ""),
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
      <button
        type="button"
        onClick={openModal}
        aria-label="Modifier le jury"
        title="Modifier le jury"
        className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
      >
        <Pencil size={15} />
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
                    Modifier le jury
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

                <form action={handleSubmit} className="mt-4 flex flex-col gap-4">
                  {error ? <FormError message={error} /> : null}

                  <div>
                    <label htmlFor={`edit-jury-name-${juryId}`} className="text-sm font-medium text-ink">
                      Nom complet
                    </label>
                    <input
                      id={`edit-jury-name-${juryId}`}
                      name="name"
                      defaultValue={name}
                      required
                      className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`edit-jury-specialty-${juryId}`}
                      className="text-sm font-medium text-ink"
                    >
                      Spécialité / domaine d&apos;expertise
                    </label>
                    <input
                      id={`edit-jury-specialty-${juryId}`}
                      name="specialty"
                      defaultValue={specialty}
                      required
                      className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
                    />
                  </div>

                  <div className="mt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
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
                      {isPending ? "Enregistrement…" : "Enregistrer"}
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
