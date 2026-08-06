"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { FormError } from "@/components/auth/FormError";
import { updateJuryProfileAction, type AccountFormState } from "@/lib/actions/account";

const initialState: AccountFormState = {};

interface JuryProfileFormProps {
  name: string;
  specialty: string;
}

export function JuryProfileForm({ name, specialty }: JuryProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateJuryProfileAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? <FormError message={state.error} /> : null}
      {state.success ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          Vos informations ont été mises à jour.
        </p>
      ) : null}

      <FormField label="Nom complet" name="name" type="text" defaultValue={name} required />
      <FormField
        label="Spécialité / domaine d'expertise"
        name="specialty"
        type="text"
        defaultValue={specialty}
        required
      />

      <Button type="submit" tone="light" variant="primary" className="self-start" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
