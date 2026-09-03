"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { FormError } from "@/components/auth/FormError";
import { updateInstitutionProfileAction, type AccountFormState } from "@/lib/actions/account";

const initialState: AccountFormState = {};

interface InstitutionProfileFormProps {
  name: string;
  institutionName: string;
  country: string;
  city: string;
  website: string;
}

export function InstitutionProfileForm({
  name,
  institutionName,
  country,
  city,
  website,
}: InstitutionProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateInstitutionProfileAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? <FormError message={state.error} /> : null}
      {state.success ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          Vos informations ont été mises à jour.
        </p>
      ) : null}

      <FormField label="Nom du responsable" name="name" type="text" defaultValue={name} required />
      <FormField
        label="Nom de l'établissement"
        name="institutionName"
        type="text"
        defaultValue={institutionName}
        required
      />
      <FormField label="Pays" name="country" type="text" defaultValue={country} />
      <FormField label="Ville" name="city" type="text" defaultValue={city} />
      <FormField
        label="Site web (facultatif)"
        name="website"
        type="text"
        defaultValue={website}
        placeholder="exemple.edu"
      />

      <Button type="submit" tone="light" variant="primary" className="self-start" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
