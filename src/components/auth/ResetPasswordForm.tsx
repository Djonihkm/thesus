"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { FormError } from "@/components/auth/FormError";
import { resetPasswordAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="token" value={token} />

      <FormField
        label="Nouveau mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormField
        label="Confirmer le mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {state.error ? <FormError message={state.error} /> : null}

      <Button type="submit" tone="light" variant="primary" className="w-full" disabled={isPending}>
        {isPending ? "Un instant…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
