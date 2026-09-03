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

// Événements de cycle de vie d'un abonnement qu'on choisit de traiter — pas un miroir de tous
// les événements bruts du fournisseur. "activated" (paiement initial confirmé) existait déjà
// (ex-PaymentConfirmation) ; "period_synced" et "canceled" comblent un manque réel : sans eux,
// seul l'instant de la création était jamais reflété en base, jamais un renouvellement ni une
// annulation déclenchée côté fournisseur (portail self-service, échec de paiement définitif).
export type WebhookEvent =
  | { kind: "activated"; confirmation: PaymentConfirmation }
  // currentPeriodEnd resynchronisé sur la valeur réelle côté fournisseur — status reflète le
  // statut fournisseur au moment de l'événement (peut redevenir "ACTIVE" après une relance de
  // paiement réussie, par exemple). EXPIRED distingue un abonnement dont les relances de
  // paiement ont échoué (fin "subie") d'une CANCELED explicite (résiliation volontaire, voir
  // le cas "canceled" ci-dessous) — les deux existaient dans SubscriptionStatus mais EXPIRED
  // n'était jusqu'ici jamais écrit nulle part.
  | {
      kind: "period_synced";
      providerSubscriptionId: string;
      currentPeriodEnd: Date;
      status: "ACTIVE" | "CANCELED" | "EXPIRED";
    }
  | { kind: "canceled"; providerSubscriptionId: string };

export interface PaymentProvider {
  readonly name: string;

  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;

  // Vérifie l'authenticité du webhook et renvoie un événement de cycle de vie typé s'il s'agit
  // d'un événement qu'on traite — null pour tout autre événement (à ignorer silencieusement)
  // ou en cas de signature invalide (déjà logué côté implémentation).
  parseWebhookEvent(rawBody: string, signatureHeader: string | null): Promise<WebhookEvent | null>;

  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  // Session vers le portail de gestion en libre-service du fournisseur (gérer/annuler
  // l'abonnement, historique de facturation) — Stripe le fournit nativement (Customer
  // Portal). Un futur fournisseur local (FedaPay ou équivalent) pourrait ne pas offrir
  // d'équivalent ; dans ce cas son implémentation devra lever une erreur explicite plutôt
  // que d'être omise silencieusement de l'interface.
  createPortalSession(input: PortalSessionInput): Promise<PortalSessionResult>;
}
