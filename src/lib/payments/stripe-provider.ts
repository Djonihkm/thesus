// src/lib/payments/stripe-provider.ts
//
// MODE TEST UNIQUEMENT — squelette pour valider toute la logique d'abonnement (Checkout,
// webhook, activation) avant que le responsable puisse fournir les informations
// bancaires/entreprise nécessaires à n'importe quel fournisseur de paiement réel. Stripe
// permet de créer un compte et des clés de test (sk_test_...) sans aucune info bancaire —
// la vérification KYC n'est requise que pour activer les paiements RÉELS.
//
// Stripe n'est PAS un fournisseur disponible pour un compte marchand béninois (46 pays
// éligibles, le Bénin n'en fait pas partie — vérifié). Cette implémentation ne doit donc
// JAMAIS tourner avec une clé sk_live_ en production — voir le garde-fou dans
// getStripeClient ci-dessous. La mise en prod réelle nécessitera une implémentation
// FedaPay (ou équivalent local) derrière la même interface PaymentProvider (voir
// provider.ts) ; aucun code appelant ne devrait avoir à changer.
import Stripe from "stripe";
import type {
  PaymentProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentConfirmation,
  PortalSessionInput,
  PortalSessionResult,
  WebhookEvent,
  BillingCycle,
} from "./provider";
import { logError } from "@/lib/log-error";

// Statuts Stripe considérés comme "toujours actif" — inclut past_due/incomplete (paiement en
// cours de relance côté Stripe, on ne coupe pas l'accès pendant sa fenêtre de dunning) et
// paused (abonnement suspendu volontairement, pas résilié).
const STRIPE_ACTIVE_STATUSES: ReadonlySet<Stripe.Subscription.Status> = new Set([
  "active",
  "trialing",
  "past_due",
  "incomplete",
  "paused",
]);

// Distingue une fin "subie" (relances de paiement épuisées) d'une résiliation volontaire
// (mappée sur "canceled" plus bas) — les deux sont des états terminaux Stripe mais
// SubscriptionStatus.EXPIRED/CANCELED existent précisément pour cette nuance.
const STRIPE_EXPIRED_STATUSES: ReadonlySet<Stripe.Subscription.Status> = new Set([
  "unpaid",
  "incomplete_expired",
]);

function mapStripeStatus(status: Stripe.Subscription.Status): "ACTIVE" | "CANCELED" | "EXPIRED" {
  if (STRIPE_ACTIVE_STATUSES.has(status)) return "ACTIVE";
  if (STRIPE_EXPIRED_STATUSES.has(status)) return "EXPIRED";
  return "CANCELED";
}

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY n'est pas configurée — voir .env.example pour créer un compte de test Stripe.",
    );
  }
  if (key.startsWith("sk_live_")) {
    throw new Error(
      "Clé Stripe live détectée : ce squelette est réservé au mode test (Stripe n'est pas disponible " +
        "comme fournisseur de paiement au Bénin, voir le commentaire en tête de ce fichier).",
    );
  }
  return new Stripe(key);
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: input.customerEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: [
        {
          price_data: {
            // XOF (franc CFA) est une devise "zéro décimale" côté Stripe (comme JPY) :
            // unit_amount est le montant entier en FCFA, pas des centimes.
            currency: "xof",
            unit_amount: input.amountFcfa,
            recurring: { interval: input.billingCycle === "YEARLY" ? "year" : "month" },
            product_data: { name: `Thesus — ${input.planName}` },
          },
          quantity: 1,
        },
      ],
      metadata: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        planId: input.planId,
        planCode: input.planCode,
        billingCycle: input.billingCycle,
      },
    });

    if (!session.url) {
      throw new Error("Stripe n'a pas renvoyé d'URL de redirection pour cette session.");
    }
    return { redirectUrl: session.url, providerSessionId: session.id };
  },

  // checkout.session.completed -> activation initiale (le seul événement géré jusqu'ici).
  // customer.subscription.updated -> resynchronise currentPeriodEnd + status à chaque
  // changement côté Stripe (renouvellement réussi, échec de paiement, reprise) — sans lui,
  // currentPeriodEnd n'était jamais rafraîchi après le tout premier paiement, et un abonné
  // normalement facturé se faisait rétrograder en Free silencieusement dès la fin de sa
  // première période (voir isSubscriptionCurrentlyActive dans subscription.ts).
  // customer.subscription.deleted -> annulation définitive (portail self-service ou échec
  // de paiement épuisant les relances).
  async parseWebhookEvent(rawBody: string, signatureHeader: string | null): Promise<WebhookEvent | null> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !signatureHeader) return null;

    const stripe = getStripeClient();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signatureHeader, webhookSecret);
    } catch (error) {
      logError("stripe-provider:parseWebhookEvent:invalidSignature", error);
      return null;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata ?? {};

      const ownerType = metadata.ownerType;
      const ownerId = metadata.ownerId;
      const planId = metadata.planId;
      const billingCycle = metadata.billingCycle;
      if (
        (ownerType !== "USER" && ownerType !== "INSTITUTION") ||
        !ownerId ||
        !planId ||
        (billingCycle !== "MONTHLY" && billingCycle !== "YEARLY")
      ) {
        logError(
          "stripe-provider:parseWebhookEvent:invalidMetadata",
          new Error("Métadonnées de session Stripe incomplètes ou invalides"),
          { metadata },
        );
        return null;
      }

      const confirmation: PaymentConfirmation = {
        providerSessionId: session.id,
        providerCustomerId: typeof session.customer === "string" ? session.customer : null,
        providerSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        ownerType,
        ownerId,
        planId,
        billingCycle: billingCycle as BillingCycle,
      };
      return { kind: "activated", confirmation };
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const currentPeriodEndSeconds = subscription.items.data[0]?.current_period_end;
      if (!currentPeriodEndSeconds) return null;

      return {
        kind: "period_synced",
        providerSubscriptionId: subscription.id,
        currentPeriodEnd: new Date(currentPeriodEndSeconds * 1000),
        status: mapStripeStatus(subscription.status),
      };
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      return { kind: "canceled", providerSubscriptionId: subscription.id };
    }

    return null;
  },

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const stripe = getStripeClient();
    await stripe.subscriptions.cancel(providerSubscriptionId);
  },

  // Nécessite que le Customer Portal soit activé une fois côté Dashboard Stripe (Settings →
  // Billing → Customer portal → Activate test link) — sans quoi Stripe renvoie une erreur
  // explicite, remontée telle quelle à l'appelant.
  async createPortalSession(input: PortalSessionInput): Promise<PortalSessionResult> {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: input.providerCustomerId,
      return_url: input.returnUrl,
    });
    return { redirectUrl: session.url };
  },
};
