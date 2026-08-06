// src/app/dashboard/jury/mon-compte/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { JuryProfileForm } from "@/components/dashboard/JuryProfileForm";
import { PasswordForm } from "@/components/dashboard/PasswordForm";
import { JURY_FUNCTION_LABELS } from "@/lib/validation";

export default async function JuryMonComptePage() {
  const user = await requireRole("JURY");

  return (
    <>
      <DashboardHeader
        eyebrow="Mon compte"
        title="Paramètres du compte"
        description="Gérez vos informations personnelles et la sécurité de votre compte."
      />

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-border-dark/10 bg-surface-light p-6">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
            Informations personnelles
          </h2>
          <div className="mt-6">
            <JuryProfileForm name={user.name} specialty={user.specialty ?? ""} />
          </div>
        </section>

        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-border-dark/10 bg-surface-light p-6">
            <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Établissement</h2>
            <dl className="mt-6 flex flex-col gap-4 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">Adresse email</dt>
                <dd className="font-medium text-ink">{user.email}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">Fonction</dt>
                <dd className="font-medium text-ink">
                  {user.juryFunction ? JURY_FUNCTION_LABELS[user.juryFunction] : "—"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">Établissement</dt>
                <dd className="font-medium text-ink">
                  {user.institution?.name ?? user.affiliatedInstitutionName ?? "Non rattaché"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-ink-muted">
              L&apos;adresse email et l&apos;établissement ne peuvent pas être modifiés depuis
              cette page. Contactez le support si besoin.
            </p>
          </section>

          <section className="rounded-2xl border border-border-dark/10 bg-surface-light p-6">
            <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Mot de passe</h2>
            <div className="mt-6">
              <PasswordForm />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
