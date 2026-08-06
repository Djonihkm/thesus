"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { FormError } from "@/components/auth/FormError";
import { EmailCheckNotice } from "@/components/auth/EmailCheckNotice";
import { requestPasswordResetAction, resendPasswordResetAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);
  const [email, setEmail] = useState("");

  if (state.success) {
    return (
      <EmailCheckNotice
        email={email}
        description="Si un compte existe avec cette adresse email, un lien de réinitialisation vient de lui être envoyé."
        resendAction={resendPasswordResetAction}
      />
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormField
        label="Adresse email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      {state.error ? <FormError message={state.error} /> : null}

      <Button type="submit" tone="light" variant="primary" className="w-full" disabled={isPending}>
        {isPending ? "Envoi…" : "Envoyer le lien"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        <Link href="/connexion" className="text-ink underline underline-offset-4">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
