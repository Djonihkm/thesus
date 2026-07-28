"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { FormError } from "@/components/auth/FormError";
import { TabSelect } from "@/components/auth/TabSelect";
import { FieldOfStudyCombobox } from "@/components/auth/FieldOfStudyCombobox";
import { FIELDS_OF_STUDY } from "@/lib/fields-of-study";
import { updateProfileAction, type AccountFormState } from "@/lib/actions/account";
import { STUDY_LEVEL_LABELS, type StudyLevel } from "@/lib/validation";

const initialState: AccountFormState = {};

const STUDY_LEVEL_OPTIONS = (Object.entries(STUDY_LEVEL_LABELS) as [StudyLevel, string][]).map(
  ([value, label]) => ({ value, label }),
);

interface ProfileFormProps {
  name: string;
  country: string;
  fieldOfStudy: string;
  studyLevel: StudyLevel;
  studentNumber: string;
}

export function ProfileForm({
  name,
  country,
  fieldOfStudy,
  studyLevel: initialStudyLevel,
  studentNumber,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);
  const [studyLevel, setStudyLevel] = useState<StudyLevel>(initialStudyLevel);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? <FormError message={state.error} /> : null}
      {state.success ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
          Vos informations ont été mises à jour.
        </p>
      ) : null}

      <FormField label="Nom complet" name="name" type="text" defaultValue={name} required />
      <FormField label="Pays" name="country" type="text" defaultValue={country} required />
      <FieldOfStudyCombobox label="Filière" options={FIELDS_OF_STUDY} defaultValue={fieldOfStudy} />

      <div className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">Niveau d&apos;étude</span>
        <TabSelect
          ariaLabel="Niveau d'étude"
          value={studyLevel}
          onChange={setStudyLevel}
          options={STUDY_LEVEL_OPTIONS}
        />
        <input type="hidden" name="studyLevel" value={studyLevel} />
      </div>

      <FormField
        label="Matricule (facultatif)"
        name="studentNumber"
        type="text"
        defaultValue={studentNumber}
      />

      <Button type="submit" tone="light" variant="primary" className="self-start" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
