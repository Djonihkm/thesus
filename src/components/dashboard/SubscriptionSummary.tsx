"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
import { createPortalSessionAction } from "@/lib/actions/subscription";

export interface SubscriptionSummaryProps {
  planName: string;
  isFree: boolean;
  features: string[];
  // Non renseignés si isFree (aucun abonnement payant actif).
  billingCycleLabel?: string;
  renewalDateLabel?: string;
  priceLabel?: string;
  canManage: boolean;
}

export function SubscriptionSummary({
  planName,
  isFree,
  features,
  billingCycleLabel,
  renewalDateLabel,
  priceLabel,
  canManage,
}: SubscriptionSummaryProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-border-dark/10 bg-surface-light p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Abonnement</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
            isFree ? "bg-surface-neutral text-ink-muted" : "bg-accent-lime/20 text-accent-dark"
          }`}
        >
          Plan {planName}
        </span>
      </div>

      {isFree ? (
        <div className="mt-5 rounded-xl border border-dashed border-border-dark/20 bg-surface-neutral/50 p-4">
          <p className="text-sm text-ink">
            Vous êtes actuellement sur le plan gratuit. Passez à un plan payant pour débloquer
            les fonctionnalités ci-dessous.
          </p>
        </div>
      ) : (
        <dl className="mt-5 flex flex-col gap-3 text-sm">
          {priceLabel ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">Tarif</dt>
              <dd className="font-medium text-ink">{priceLabel}</dd>
            </div>
          ) : null}
          {billingCycleLabel ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">Cycle de facturation</dt>
              <dd className="font-medium text-ink">{billingCycleLabel}</dd>
            </div>
          ) : null}
          {renewalDateLabel ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">Prochain renouvellement</dt>
              <dd className="font-medium text-ink">{renewalDateLabel}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <ul className="mt-5 flex flex-col gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm">
            <Check size={16} className="shrink-0 text-accent-dark" />
            <span className="text-ink-muted">{feature}</span>
          </li>
        ))}
      </ul>

      {error ? <p className="mt-4 text-xs text-flag">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {isFree ? (
          <Link
            href="/#tarifs"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-lime px-5 py-2.5 text-sm font-medium text-ink transition hover:brightness-95"
          >
            Passer à un plan payant
            <ArrowUpRight size={16} />
          </Link>
        ) : (
          <Link
            href="/#tarifs"
            className="inline-flex items-center rounded-full border border-border-neutral px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-neutral"
          >
            Changer de plan
          </Link>
        )}

        {!isFree && canManage ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await createPortalSessionAction();
                if (result.redirectUrl) {
                  window.location.href = result.redirectUrl;
                } else {
                  setError(result.error ?? "Une erreur est survenue.");
                }
              });
            }}
            className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:opacity-60"
          >
            {isPending ? "Redirection…" : "Gérer mon abonnement"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
