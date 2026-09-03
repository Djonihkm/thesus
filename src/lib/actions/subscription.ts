"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider, type BillingCycle } from "@/lib/payments";
import {
  STUDENT_PLANS,
  INSTITUTION_PLANS,
  type StudentPlanCode,
  type InstitutionPlanCode,
  type PlanDefinition,
} from "@/lib/pricing-config";
import { logError } from "@/lib/log-error";

export type CreateCheckoutState = { error?: string; redirectUrl?: string };

// Crée une session de paiement (mode test Stripe, voir src/lib/payments/) pour l'abonnement
// à un plan payant — jamais appelée pour le plan Free, qui ne nécessite aucun paiement.
export async function createCheckoutSessionAction(
  planCode: string,
  billingCycle: BillingCycle,
): Promise<CreateCheckoutState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Connectez-vous d'abord pour vous abonner." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "Compte introuvable." };
  }

  let planDefinition: PlanDefinition | undefined;
  let ownerType: "USER" | "INSTITUTION";
  let ownerId: string;

  if (user.role === "STUDENT") {
    planDefinition = STUDENT_PLANS[planCode as StudentPlanCode];
    ownerType = "USER";
    ownerId = user.id;
  } else if (user.role === "INSTITUTION") {
    if (!user.institutionId) {
      return { error: "Votre établissement n'est pas encore rattaché à la plateforme." };
    }
    planDefinition = INSTITUTION_PLANS[planCode as InstitutionPlanCode];
    ownerType = "INSTITUTION";
    ownerId = user.institutionId;
  } else {
    return { error: "Seuls les comptes étudiant ou établissement peuvent s'abonner." };
  }

  if (!planDefinition) {
    return { error: "Plan introuvable." };
  }
  if (planDefinition.code === "FREE") {
    return { error: "Le plan Free ne nécessite pas d'abonnement." };
  }

  const amountFcfa =
    billingCycle === "YEARLY" ? planDefinition.priceYearlyFcfa : planDefinition.priceMonthlyFcfa;
  if (!amountFcfa) {
    return { error: "Cette formule de facturation n'est pas disponible pour ce plan." };
  }

  const plan = await prisma.plan.findUnique({
    where: { role_code: { role: planDefinition.role, code: planDefinition.code } },
  });
  if (!plan) {
    return { error: "Plan introuvable en base — contactez le support." };
  }

  // Un changement de plan (ou de cycle de facturation) sur un abonnement déjà payant créait
  // jusqu'ici une SECONDE session Checkout sans jamais annuler la première côté fournisseur —
  // double facturation possible, et la ligne Subscription en base écrasait silencieusement la
  // référence à l'ancien abonnement Stripe toujours actif. On annule l'ancien avant de créer
  // le nouveau. Pas de proratisation ici (squelette de test) : le nouvel abonnement redémarre
  // une période pleine plutôt que de créditer le temps restant de l'ancien — acceptable pour
  // valider la logique, à traiter proprement avec une vraie implémentation FedaPay.
  const existingSubscription =
    ownerType === "USER"
      ? await prisma.subscription.findUnique({ where: { userId: ownerId } })
      : await prisma.subscription.findUnique({ where: { institutionId: ownerId } });

  if (existingSubscription?.providerSubscriptionId && existingSubscription.status === "ACTIVE") {
    try {
      await getPaymentProvider().cancelSubscription(existingSubscription.providerSubscriptionId);
    } catch (error) {
      // Ne bloque pas le changement de plan si l'ancien abonnement est déjà dans un état que
      // Stripe refuse d'annuler à nouveau (ex. déjà annulé côté fournisseur, webhook pas
      // encore traité) — la nouvelle session Checkout doit pouvoir se créer quand même.
      logError("actions/subscription:createCheckoutSessionAction:cancelPrevious", error, { ownerId });
    }
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const dashboardPath = user.role === "STUDENT" ? "/dashboard/etudiant" : "/dashboard/etablissement";

  try {
    const result = await getPaymentProvider().createCheckoutSession({
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      billingCycle,
      amountFcfa,
      customerEmail: user.email,
      successUrl: `${appUrl}${dashboardPath}?subscription=success`,
      cancelUrl: `${appUrl}${dashboardPath}?subscription=canceled`,
      ownerType,
      ownerId,
    });
    return { redirectUrl: result.redirectUrl };
  } catch (error) {
    logError("actions/subscription:createCheckoutSessionAction", error, { ownerId, planCode });
    return {
      error:
        error instanceof Error ? error.message : "Le service de paiement est momentanément indisponible.",
    };
  }
}

// Redirige vers le portail de gestion en libre-service du fournisseur (Stripe Customer
// Portal en mode test) — gérer moyen de paiement, historique de facturation, annuler
// l'abonnement, sans reconstruire cette UI à la main.
export async function createPortalSessionAction(): Promise<CreateCheckoutState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Connectez-vous d'abord." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "Compte introuvable." };
  }

  const subscription =
    user.role === "STUDENT"
      ? await prisma.subscription.findUnique({ where: { userId: user.id } })
      : user.role === "INSTITUTION" && user.institutionId
        ? await prisma.subscription.findUnique({ where: { institutionId: user.institutionId } })
        : null;

  if (!subscription?.providerCustomerId) {
    return { error: "Aucun abonnement actif à gérer." };
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const dashboardPath =
    user.role === "STUDENT" ? "/dashboard/etudiant/mon-compte" : "/dashboard/etablissement/mon-compte";

  try {
    const result = await getPaymentProvider().createPortalSession({
      providerCustomerId: subscription.providerCustomerId,
      returnUrl: `${appUrl}${dashboardPath}`,
    });
    return { redirectUrl: result.redirectUrl };
  } catch (error) {
    logError("actions/subscription:createPortalSessionAction", error, { userId: user.id });
    return {
      error:
        error instanceof Error ? error.message : "Le service de paiement est momentanément indisponible.",
    };
  }
}
