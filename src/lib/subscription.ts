// src/lib/subscription.ts
//
// Résolution du plan actif d'un compte (étudiant ou établissement) et garde-fous associés.
// Un compte sans Subscription active retombe silencieusement sur le plan FREE de son rôle —
// jamais d'erreur, jamais de blocage d'accès au dashboard lui-même, seulement des limites
// plus basses. Voir pricing-config.ts pour la définition des plans et de leurs limites.
import { Prisma, type Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ALL_PLAN_DEFINITIONS,
  STUDENT_PLANS,
  INSTITUTION_PLANS,
  type StudentPlanCode,
  type StudentPlanLimits,
  type InstitutionPlanCode,
  type InstitutionPlanLimits,
  type BillingCycle,
} from "@/lib/pricing-config";
import type { PaymentConfirmation } from "@/lib/payments/provider";

// Synchronise le catalogue Plan en base depuis pricing-config.ts (source de vérité) — upsert
// idempotent. À appeler après tout changement de pricing-config.ts (voir le script ponctuel
// utilisé pour le déploiement initial) ; jamais appelé à chaque lecture de plan, pour ne pas
// écrire en base à chaque chargement de page.
export async function syncPlansFromConfig(): Promise<void> {
  await Promise.all(
    ALL_PLAN_DEFINITIONS.map((definition) =>
      prisma.plan.upsert({
        where: { role_code: { role: definition.role, code: definition.code } },
        create: {
          role: definition.role,
          code: definition.code,
          name: definition.name,
          description: definition.description,
          limits: definition.limits as unknown as Prisma.InputJsonValue,
          priceMonthlyFcfa: definition.priceMonthlyFcfa,
          priceYearlyFcfa: definition.priceYearlyFcfa,
        },
        update: {
          name: definition.name,
          description: definition.description,
          limits: definition.limits as unknown as Prisma.InputJsonValue,
          priceMonthlyFcfa: definition.priceMonthlyFcfa,
          priceYearlyFcfa: definition.priceYearlyFcfa,
        },
      }),
    ),
  );
}

interface ActiveStudentPlan {
  planCode: StudentPlanCode;
  planName: string;
  limits: StudentPlanLimits;
  subscription: Subscription | null;
}

interface ActiveInstitutionPlan {
  planCode: InstitutionPlanCode;
  planName: string;
  limits: InstitutionPlanLimits;
  subscription: Subscription | null;
}

// Une Subscription dont la période en cours est dépassée est traitée comme inactive
// indépendamment de son statut stocké — ne fait jamais confiance uniquement à un webhook
// d'annulation qui pourrait ne jamais arriver (expiration naturelle en fin de période plutôt
// qu'un mécanisme d'annulation actif côté fournisseur).
function isSubscriptionCurrentlyActive(subscription: Subscription): boolean {
  if (subscription.status !== "ACTIVE") return false;
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) return false;
  return true;
}

export async function getStudentPlan(userId: string): Promise<ActiveStudentPlan> {
  const subscription = await prisma.subscription.findUnique({ where: { userId }, include: { plan: true } });
  const active = subscription && isSubscriptionCurrentlyActive(subscription) ? subscription : null;

  const code = (active?.plan.code as StudentPlanCode | undefined) ?? "FREE";
  const definition = STUDENT_PLANS[code] ?? STUDENT_PLANS.FREE;

  return { planCode: definition.code, planName: definition.name, limits: definition.limits, subscription: active };
}

export async function getInstitutionPlan(institutionId: string): Promise<ActiveInstitutionPlan> {
  const subscription = await prisma.subscription.findUnique({
    where: { institutionId },
    include: { plan: true },
  });
  const active = subscription && isSubscriptionCurrentlyActive(subscription) ? subscription : null;

  const code = (active?.plan.code as InstitutionPlanCode | undefined) ?? "FREE";
  const definition = INSTITUTION_PLANS[code] ?? INSTITUTION_PLANS.FREE;

  return { planCode: definition.code, planName: definition.name, limits: definition.limits, subscription: active };
}

export interface LimitCheck {
  allowed: boolean;
  reason?: string;
}

// --- Garde-fous étudiant --------------------------------------------------------------------

export async function canCreateMemoire(studentId: string): Promise<LimitCheck> {
  const { limits, planName } = await getStudentPlan(studentId);
  if (limits.maxActiveMemoires === null) return { allowed: true };

  // FAILED n'est pas compté : un dépôt qui a échoué à l'extraction ne doit pas consommer
  // durablement le seul mémoire actif autorisé par le plan Free.
  const activeCount = await prisma.memoire.count({
    where: { studentId, status: { not: "FAILED" } },
  });

  if (activeCount >= limits.maxActiveMemoires) {
    const n = limits.maxActiveMemoires;
    return {
      allowed: false,
      reason: `Votre plan ${planName} permet ${n} mémoire${n > 1 ? "s" : ""} actif${n > 1 ? "s" : ""} maximum. Passez à un plan supérieur pour en déposer davantage.`,
    };
  }
  return { allowed: true };
}

// --- Garde-fous établissement ----------------------------------------------------------------

export async function canAddStudentToInstitution(institutionId: string): Promise<LimitCheck> {
  const { limits, planName } = await getInstitutionPlan(institutionId);
  if (limits.maxStudents === null) return { allowed: true };

  const count = await prisma.user.count({ where: { institutionId, role: "STUDENT" } });
  if (count >= limits.maxStudents) {
    return {
      allowed: false,
      reason: `Votre établissement a atteint la limite de ${limits.maxStudents} étudiants de son plan ${planName}.`,
    };
  }
  return { allowed: true };
}

export async function canAddJury(institutionId: string): Promise<LimitCheck> {
  const { limits, planName } = await getInstitutionPlan(institutionId);
  if (limits.maxJurys === null) return { allowed: true };

  const count = await prisma.user.count({ where: { institutionId, role: "JURY" } });
  if (count >= limits.maxJurys) {
    return {
      allowed: false,
      reason: `Votre établissement a atteint la limite de ${limits.maxJurys} jurys de son plan ${planName}.`,
    };
  }
  return { allowed: true };
}

// --- Activation depuis le webhook du fournisseur de paiement ---------------------------------

function periodEndFrom(cycle: BillingCycle, start: Date): Date {
  const end = new Date(start);
  if (cycle === "YEARLY") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

// Appelée depuis la route webhook (voir src/app/api/webhooks/stripe/route.ts) une fois la
// confirmation de paiement vérifiée par le PaymentProvider — jamais appelée directement
// depuis une action déclenchée par le client, pour ne jamais activer un abonnement sans
// confirmation réelle du fournisseur.
export async function activateSubscriptionFromPayment(confirmation: PaymentConfirmation): Promise<void> {
  const now = new Date();
  const currentPeriodEnd = periodEndFrom(confirmation.billingCycle, now);

  const data = {
    planId: confirmation.planId,
    status: "ACTIVE" as const,
    billingCycle: confirmation.billingCycle,
    currentPeriodStart: now,
    currentPeriodEnd,
    providerName: "stripe",
    providerSessionId: confirmation.providerSessionId,
    providerCustomerId: confirmation.providerCustomerId,
    providerSubscriptionId: confirmation.providerSubscriptionId,
  };

  if (confirmation.ownerType === "USER") {
    await prisma.subscription.upsert({
      where: { userId: confirmation.ownerId },
      create: { userId: confirmation.ownerId, ...data },
      update: data,
    });
  } else {
    await prisma.subscription.upsert({
      where: { institutionId: confirmation.ownerId },
      create: { institutionId: confirmation.ownerId, ...data },
      update: data,
    });
  }
}
