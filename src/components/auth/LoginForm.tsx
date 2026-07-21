"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { FormError } from "@/components/auth/FormError";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? <FormError message={state.error} /> : null}

      <FormField
        label="Adresse email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        minLength={8}
        required
      />

      <div className="-mt-2 flex justify-end">
        <Link
          href="/mot-de-passe-oublie"
          className="text-sm text-ink-muted hover:text-ink"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <Button
        type="submit"
        tone="light"
        variant="primary"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link
          href="/inscription"
          className="text-ink underline underline-offset-4"
        >
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
