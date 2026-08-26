// src/lib/payments/provider.ts
//
// Interface générique côté fournisseur de paiement — aucune dépendance à un fournisseur
// précis ici. Stripe (mode test, voir stripe-provider.ts) est la seule implémentation
// aujourd'hui, UNIQUEMENT parce que Stripe permet de créer un compte de test sans
// information bancaire réelle (la vérification KYC n'est requise que pour activer les
// paiements réels). Stripe N'EST PAS un fournisseur de paiement disponible au Bénin — seuls
// 46 pays peuvent créer un compte marchand Stripe, le Bénin n'en fait pas partie (vérifié).
//
// Pour la mise en prod réelle, une implémentation FedaPay (ou équivalent local — mobile
// money + cartes) devra être ajoutée derrière cette même interface, dans un fichier
// fedapay-provider.ts. Aucun code appelant (actions, webhook, page de tarification) ne
// devrait avoir à changer — seul src/lib/payments/index.ts bascule le fournisseur actif.

export type SubscriptionOwnerType = "USER" | "INSTITUTION";
export type BillingCycle = "MONTHLY" | "YEARLY";

export interface CheckoutSessionInput {
  planId: string;
  planCode: string;
  planName: string;
  billingCycle: BillingCycle;
  amountFcfa: number;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  // Reportées dans les métadonnées de la session côté fournisseur — permettent de relier la
  // confirmation de paiement (webhook) à la Subscription à créer/mettre à jour, sans avoir à
  // faire confiance à quoi que ce soit d'autre transmis par le client.
  ownerType: SubscriptionOwnerType;
  ownerId: string;
}

export interface CheckoutSessionResult {
  redirectUrl: string;
  providerSessionId: string;
}

export interface PaymentConfirmation {
  providerSessionId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  ownerType: SubscriptionOwnerType;
  ownerId: string;
  planId: string;
  billingCycle: BillingCycle;
}

export interface PortalSessionInput {
  providerCustomerId: string;
  returnUrl: string;
}

export interface PortalSessionResult {
  redirectUrl: string;
}

export interface PaymentProvider {
  readonly name: string;

  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;

  // Vérifie l'authenticité du webhook et renvoie une confirmation de paiement typée si
  // l'événement en est une — null pour tout autre événement (à ignorer silencieusement) ou
  // en cas de signature invalide (déjà logué côté implémentation).
  parseWebhookConfirmation(
    rawBody: string,
    signatureHeader: string | null,
  ): Promise<PaymentConfirmation | null>;

  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  // Session vers le portail de gestion en libre-service du fournisseur (gérer/annuler
  // l'abonnement, historique de facturation) — Stripe le fournit nativement (Customer
  // Portal). Un futur fournisseur local (FedaPay ou équivalent) pourrait ne pas offrir
  // d'équivalent ; dans ce cas son implémentation devra lever une erreur explicite plutôt
  // que d'être omise silencieusement de l'interface.
  createPortalSession(input: PortalSessionInput): Promise<PortalSessionResult>;
}
