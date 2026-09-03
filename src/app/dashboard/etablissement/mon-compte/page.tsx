// src/app/dashboard/etablissement/mon-compte/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PasswordForm } from "@/components/dashboard/PasswordForm";
import { InstitutionProfileForm } from "@/components/dashboard/InstitutionProfileForm";
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
          <p className="mt-1 text-xs text-ink-muted">
            Adresse email de connexion : {user.email} — non modifiable depuis cette page,
            contactez le support si besoin.
          </p>
          <div className="mt-6">
            <InstitutionProfileForm
              name={user.name}
              institutionName={user.institution?.name ?? ""}
              country={user.institution?.country ?? ""}
              city={user.institution?.city ?? ""}
              website={user.institution?.website ?? ""}
            />
          </div>
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
