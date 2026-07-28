"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { FormError } from "@/components/auth/FormError";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { TabSelect } from "@/components/auth/TabSelect";
import { Stepper } from "@/components/auth/Stepper";
import { InstitutionCombobox } from "@/components/auth/InstitutionCombobox";
import { FieldOfStudyCombobox } from "@/components/auth/FieldOfStudyCombobox";
import { FIELDS_OF_STUDY } from "@/lib/fields-of-study";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import {
  isValidEmail,
  isValidPassword,
  PASSWORD_MIN_LENGTH,
  STUDY_LEVEL_LABELS,
  JURY_FUNCTION_LABELS,
  type Role,
  type StudyLevel,
  type JuryFunction,
} from "@/lib/validation";

const initialState: AuthFormState = {};

const STUDY_LEVEL_OPTIONS = (Object.entries(STUDY_LEVEL_LABELS) as [StudyLevel, string][]).map(
  ([value, label]) => ({ value, label }),
);

const JURY_FUNCTION_OPTIONS = (Object.entries(JURY_FUNCTION_LABELS) as [JuryFunction, string][]).map(
  ([value, label]) => ({ value, label }),
);

type StepOneValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm({
  institutions,
}: {
  institutions: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  const [step, setStep] = useState<1 | 2>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("STUDENT");
  const [studyLevel, setStudyLevel] = useState<StudyLevel>("LICENCE");
  const [juryFunction, setJuryFunction] = useState<JuryFunction>("ENSEIGNANT");
  const [stepOne, setStepOne] = useState<StepOneValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-lg font-medium text-ink">Vérifiez votre boîte mail</p>
        <p className="leading-relaxed text-ink-muted">
          Un email de confirmation vient de vous être envoyé. Cliquez sur le lien qu&apos;il
          contient pour activer votre compte et vous connecter.
        </p>
        <Link href="/connexion" className="text-sm text-ink underline underline-offset-4">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  function updateStepOne<K extends keyof StepOneValues>(key: K, value: StepOneValues[K]) {
    setStepOne((current) => ({ ...current, [key]: value }));
  }

  function handleContinue() {
    if (!stepOne.name.trim()) {
      setStepError("Indiquez votre nom complet.");
      return;
    }
    if (!isValidEmail(stepOne.email)) {
      setStepError("Cette adresse email ne semble pas valide.");
      return;
    }
    if (!isValidPassword(stepOne.password)) {
      setStepError(`Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`);
      return;
    }
    if (stepOne.password !== stepOne.confirmPassword) {
      setStepError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setStepError(null);
    setStep(2);
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Stepper step={step} total={2} />

      {step === 1 ? (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink-muted">Vous êtes</span>
            <RoleSelector value={role} onChange={setRole} />
            <input type="hidden" name="role" value={role} />
          </div>

          <FormField
            label="Nom complet"
            name="name"
            type="text"
            autoComplete="name"
            value={stepOne.name}
            onChange={(e) => updateStepOne("name", e.target.value)}
            required
          />
          <FormField
            label="Adresse email"
            name="email"
            type="email"
            autoComplete="email"
            value={stepOne.email}
            onChange={(e) => updateStepOne("email", e.target.value)}
            required
          />
          <FormField
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={stepOne.password}
            onChange={(e) => updateStepOne("password", e.target.value)}
            required
          />
          <FormField
            label="Confirmer le mot de passe"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={stepOne.confirmPassword}
            onChange={(e) => updateStepOne("confirmPassword", e.target.value)}
            required
          />

          {stepError ? <FormError message={stepError} /> : null}

          <Button type="button" tone="light" variant="primary" className="w-full" onClick={handleContinue}>
            Continuer
          </Button>
        </>
      ) : (
        <>
          {/* Step 1 values travel to the server action as hidden fields once step 2 is reached. */}
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="name" value={stepOne.name} />
          <input type="hidden" name="email" value={stepOne.email} />
          <input type="hidden" name="password" value={stepOne.password} />
          <input type="hidden" name="confirmPassword" value={stepOne.confirmPassword} />

          {role === "STUDENT" ? (
            <>
              <FormField label="Pays" name="country" type="text" autoComplete="country-name" required />
              <InstitutionCombobox label="Établissement" institutions={institutions} />
              <FieldOfStudyCombobox label="Filière" options={FIELDS_OF_STUDY} />
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
              />
            </>
          ) : null}

          {role === "JURY" ? (
            <>
              <InstitutionCombobox label="Établissement de rattachement" institutions={institutions} />
              <FormField label="Spécialité / domaine d'expertise" name="specialty" type="text" required />
              <div className="flex flex-col gap-2">
                <span className="text-sm text-ink-muted">Fonction</span>
                <TabSelect
                  ariaLabel="Fonction"
                  value={juryFunction}
                  onChange={setJuryFunction}
                  options={JURY_FUNCTION_OPTIONS}
                />
                <input type="hidden" name="juryFunction" value={juryFunction} />
              </div>
            </>
          ) : null}

          {role === "INSTITUTION" ? (
            <>
              <FormField label="Nom de l'établissement" name="institutionName" type="text" required />
              <FormField
                label="Pays"
                name="institutionCountry"
                type="text"
                autoComplete="country-name"
                required
              />
              <FormField label="Ville" name="city" type="text" autoComplete="address-level2" required />
              <FormField label="Site web (facultatif)" name="website" type="text" placeholder="https://" />
            </>
          ) : null}

          {state.error ? <FormError message={state.error} /> : null}

          <div className="flex gap-3">
            <Button type="button" tone="light" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Retour
            </Button>
            <Button
              type="submit"
              tone="light"
              variant="primary"
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? "Un instant…" : "Créer mon compte"}
            </Button>
          </div>
        </>
      )}

      <p className="text-center text-sm text-ink-muted">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-ink underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
