"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { FormError } from "@/components/auth/FormError";
import { changePasswordAction, type AccountFormState } from "@/lib/actions/account";

const initialState: AccountFormState = {};

export function PasswordForm({ redirectTo }: { redirectTo?: string } = {}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  useEffect(() => {
    if (state.success && redirectTo) {
      router.push(redirectTo);
    }
  }, [state.success, redirectTo, router]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? <FormError message={state.error} /> : null}
      {state.success ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          Votre mot de passe a été mis à jour.
        </p>
      ) : null}

      <FormField
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
      />
      <FormField
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormField
        label="Confirmer le nouveau mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <Button type="submit" tone="light" variant="primary" className="self-start" disabled={isPending}>
        {isPending ? "Mise à jour…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
