// src/app/dashboard/etudiant/mon-compte/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { PasswordForm } from "@/components/dashboard/PasswordForm";
import { SubscriptionSummary } from "@/components/dashboard/SubscriptionSummary";
import { STUDY_LEVEL_LABELS, type StudyLevel } from "@/lib/validation";
import { getStudentPlan } from "@/lib/subscription";
import { STUDENT_PLANS, formatFcfa } from "@/lib/pricing-config";
import { STUDENT_PLAN_FEATURES } from "@/lib/plan-features";

const renewalDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function MonComptePage() {
  const user = await requireRole("STUDENT");
  const { planCode, planName, subscription } = await getStudentPlan(user.id);

  const priceLabel = subscription
    ? subscription.billingCycle === "YEARLY"
      ? `${formatFcfa(STUDENT_PLANS[planCode].priceYearlyFcfa ?? 0)} / an`
      : `${formatFcfa(STUDENT_PLANS[planCode].priceMonthlyFcfa ?? 0)} / mois`
    : undefined;

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
            <ProfileForm
              name={user.name}
              country={user.country ?? ""}
              fieldOfStudy={user.fieldOfStudy ?? ""}
              studyLevel={(user.studyLevel as StudyLevel) ?? "LICENCE"}
              studentNumber={user.studentNumber ?? ""}
            />
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
                <dt className="text-ink-muted">Niveau d&apos;étude</dt>
                <dd className="font-medium text-ink">
                  {user.studyLevel ? STUDY_LEVEL_LABELS[user.studyLevel] : "—"}
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
            <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
              Mot de passe
            </h2>
            <div className="mt-6">
              <PasswordForm />
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8">
        <SubscriptionSummary
          planName={planName}
          isFree={planCode === "FREE"}
          features={STUDENT_PLAN_FEATURES[planCode]}
          billingCycleLabel={
            subscription ? (subscription.billingCycle === "YEARLY" ? "Annuel" : "Mensuel") : undefined
          }
          renewalDateLabel={
            subscription?.currentPeriodEnd
              ? renewalDateFormatter.format(subscription.currentPeriodEnd)
              : undefined
          }
          priceLabel={priceLabel}
          canManage={Boolean(subscription?.providerCustomerId)}
        />
      </div>
    </>
  );
}
