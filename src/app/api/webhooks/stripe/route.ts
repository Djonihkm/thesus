// src/app/api/webhooks/stripe/route.ts
//
// MODE TEST — voir le commentaire en tête de src/lib/payments/stripe-provider.ts. Reçoit les
// événements de cycle de vie d'un abonnement Stripe (activation, renouvellement/resync de
// période, annulation — voir WebhookEvent dans payments/provider.ts) et met à jour la
// Subscription correspondante. Corps brut (pas de parsing JSON par Next.js) requis pour
// vérifier la signature — voir stripeProvider.parseWebhookEvent.
//
// Événements Stripe Dashboard à sélectionner pour cet endpoint : checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted — tout autre événement est
// ignoré silencieusement (voir plus bas), inutile de le cocher.
import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import {
  activateSubscriptionFromPayment,
  syncSubscriptionPeriod,
  cancelSubscriptionRecord,
} from "@/lib/subscription";
import { logError } from "@/lib/log-error";

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const webhookEvent = await getPaymentProvider().parseWebhookEvent(rawBody, signature);
  if (!webhookEvent) {
    // Pas un événement à traiter (autre type d'événement Stripe, ou signature invalide déjà
    // loguée côté provider) — 200 quand même : Stripe réessaierait indéfiniment un événement
    // qu'on n'a jamais eu l'intention de traiter.
    return NextResponse.json({ received: true });
  }

  try {
    switch (webhookEvent.kind) {
      case "activated":
        await activateSubscriptionFromPayment(webhookEvent.confirmation);
        break;
      case "period_synced":
        await syncSubscriptionPeriod(
          webhookEvent.providerSubscriptionId,
          webhookEvent.currentPeriodEnd,
          webhookEvent.status,
        );
        break;
      case "canceled":
        await cancelSubscriptionRecord(webhookEvent.providerSubscriptionId);
        break;
    }
  } catch (error) {
    logError("webhooks/stripe", error, { kind: webhookEvent.kind });
    return NextResponse.json({ error: "Traitement échoué" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
