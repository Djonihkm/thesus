// src/app/dashboard/etablissement/mon-compte/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PasswordForm } from "@/components/dashboard/PasswordForm";
import { SubscriptionSummary } from "@/components/dashboard/SubscriptionSummary";
import { getInstitutionPlan } from "@/lib/subscription";
import { INSTITUTION_PLANS, formatFcfa } from "@/lib/pricing-config";
import { INSTITUTION_PLAN_FEATURES } from "@/lib/plan-features";

const renewalDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function EtablissementMonComptePage() {
  const user = await requireRole("INSTITUTION");

  if (!user.institutionId) {
    return (
      <DashboardHeader
        eyebrow="Mon compte"
        title="Paramètres du compte"
        description="Votre établissement n'est pas encore rattaché à la plateforme."
      />
    );
  }

  const { planCode, planName, subscription } = await getInstitutionPlan(user.institutionId);

  const priceLabel = subscription
    ? subscription.billingCycle === "YEARLY"
      ? `${formatFcfa(INSTITUTION_PLANS[planCode].priceYearlyFcfa ?? 0)} / an`
      : `${formatFcfa(INSTITUTION_PLANS[planCode].priceMonthlyFcfa ?? 0)} / mois`
    : undefined;

  return (
    <>
      <DashboardHeader
        eyebrow="Mon compte"
        title="Paramètres du compte"
        description="Gérez les informations de votre compte et de votre abonnement."
      />

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-border-dark/10 bg-surface-light p-6">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
            Informations
          </h2>
          <dl className="mt-6 flex flex-col gap-4 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">Nom du responsable</dt>
              <dd className="font-medium text-ink">{user.name}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">Adresse email</dt>
              <dd className="font-medium text-ink">{user.email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">Établissement</dt>
              <dd className="font-medium text-ink">{user.institution?.name ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-ink-muted">
            Ces informations ne peuvent pas être modifiées depuis cette page. Contactez le
            support si besoin.
          </p>
        </section>

        <section className="rounded-2xl border border-border-dark/10 bg-surface-light p-6">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Mot de passe</h2>
          <div className="mt-6">
            <PasswordForm />
          </div>
        </section>
      </div>

      <div className="mt-8">
        <SubscriptionSummary
          planName={planName}
          isFree={planCode === "FREE"}
          features={INSTITUTION_PLAN_FEATURES[planCode]}
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
