"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";
import { createThemeAction, type ThemeActionState } from "@/lib/actions/themes";

const initialState: ThemeActionState = {};

export function ThemeForm() {
  const [state, formAction, isPending] = useActionState(async (_: ThemeActionState, formData: FormData) => {
    const result = await createThemeAction({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? ""),
    });
    if (result.success) {
      (document.getElementById("theme-form") as HTMLFormElement | null)?.reset();
    }
    return result;
  }, initialState);

  return (
    <form id="theme-form" action={formAction} className="flex flex-col gap-4">
      {state.error ? <FormError message={state.error} /> : null}
      {state.success ? (
        <p className="text-sm font-medium text-accent-dark">Thème créé et disponible pour les étudiants.</p>
      ) : null}

      <div>
        <label htmlFor="title" className="text-sm font-medium text-ink">
          Titre du thème
        </label>
        <input
          id="title"
          name="title"
          required
          className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
          placeholder="Ex. Optimisation des systèmes distribués"
        />
      </div>

      <div>
        <label htmlFor="category" className="text-sm font-medium text-ink">
          Catégorie / domaine
        </label>
        <input
          id="category"
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
        <label htmlFor="description" className="text-sm font-medium text-ink">
          Description (optionnel)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-2 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      <Button type="submit" tone="light" variant="primary" disabled={isPending} className="self-start">
        {isPending ? "Création…" : "Créer le thème"}
      </Button>
    </form>
  );
}
