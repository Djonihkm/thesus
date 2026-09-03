// src/lib/payments/index.ts
//
// Point d'entrée unique vers le fournisseur de paiement actif — le SEUL endroit à modifier
// pour basculer de Stripe (mode test, squelette) vers FedaPay (ou équivalent) le jour de la
// mise en prod réelle. Aucun autre fichier ne doit importer stripe-provider.ts directement.
import { stripeProvider } from "./stripe-provider";
import type { PaymentProvider } from "./provider";

export function getPaymentProvider(): PaymentProvider {
  return stripeProvider;
}

export type {
  PaymentProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentConfirmation,
  PortalSessionInput,
  PortalSessionResult,
  WebhookEvent,
  SubscriptionOwnerType,
  BillingCycle,
} from "./provider";
