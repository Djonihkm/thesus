// src/app/api/webhooks/stripe/route.ts
//
// MODE TEST — voir le commentaire en tête de src/lib/payments/stripe-provider.ts. Reçoit la
// confirmation de paiement Stripe (Checkout Session complétée) et active la Subscription
// correspondante. Corps brut (pas de parsing JSON par Next.js) requis pour vérifier la
// signature — voir stripeProvider.parseWebhookConfirmation.
import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { activateSubscriptionFromPayment } from "@/lib/subscription";

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const confirmation = await getPaymentProvider().parseWebhookConfirmation(rawBody, signature);
  if (!confirmation) {
    // Pas une confirmation de paiement à traiter (autre type d'événement Stripe, ou
    // signature invalide déjà loguée côté provider) — 200 quand même : Stripe réessaierait
    // indéfiniment un événement qu'on n'a jamais eu l'intention de traiter.
    return NextResponse.json({ received: true });
  }

  try {
    await activateSubscriptionFromPayment(confirmation);
  } catch (error) {
    console.error("Échec de l'activation de l'abonnement depuis le webhook Stripe :", error);
    return NextResponse.json({ error: "Traitement échoué" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
