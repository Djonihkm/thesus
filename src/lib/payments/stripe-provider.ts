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
  BillingCycle,
} from "./provider";

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

  async parseWebhookConfirmation(
    rawBody: string,
    signatureHeader: string | null,
  ): Promise<PaymentConfirmation | null> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !signatureHeader) return null;

    const stripe = getStripeClient();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signatureHeader, webhookSecret);
    } catch (error) {
      console.error("Signature webhook Stripe invalide :", error);
      return null;
    }

    if (event.type !== "checkout.session.completed") return null;
    const session = event.data.object as Stripe.Checkout.Session;
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
      console.error("Métadonnées de session Stripe incomplètes ou invalides :", metadata);
      return null;
    }

    return {
      providerSessionId: session.id,
      providerCustomerId: typeof session.customer === "string" ? session.customer : null,
      providerSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
      ownerType,
      ownerId,
      planId,
      billingCycle: billingCycle as BillingCycle,
    };
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
