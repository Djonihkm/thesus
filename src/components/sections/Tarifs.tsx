"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { createCheckoutSessionAction } from "@/lib/actions/subscription";
import {
  STUDENT_PLANS,
  INSTITUTION_PLANS,
  formatFcfa,
  type StudentPlanCode,
  type InstitutionPlanCode,
  type BillingCycle,
} from "@/lib/pricing-config";
import { STUDENT_PLAN_FEATURES, INSTITUTION_PLAN_FEATURES } from "@/lib/plan-features";

type Audience = "STUDENT" | "INSTITUTION";

const STUDENT_ORDER: StudentPlanCode[] = ["FREE", "ESSENTIEL", "COMPLET"];
const INSTITUTION_ORDER: InstitutionPlanCode[] = ["FREE", "STANDARD", "ETABLISSEMENT"];

const YEARLY_DISCOUNT_PERCENT = Math.round(
  (1 -
    STUDENT_PLANS.ESSENTIEL.priceYearlyFcfa! / (STUDENT_PLANS.ESSENTIEL.priceMonthlyFcfa! * 12)) *
    100,
);

function SubscribeButton({
  planCode,
  billingCycle,
  popular,
}: {
  planCode: string;
  billingCycle: BillingCycle;
  popular: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await createCheckoutSessionAction(planCode, billingCycle);
            if (result.redirectUrl) {
              window.location.href = result.redirectUrl;
            } else {
              setError(result.error ?? "Une erreur est survenue.");
            }
          });
        }}
        className={`mt-8 w-full rounded-full py-3 text-sm font-medium transition disabled:opacity-60 ${
          popular
            ? "bg-accent-lime text-ink hover:brightness-95"
            : "bg-ink text-paper hover:bg-ink/85"
        }`}
      >
        {isPending ? "Redirection…" : "S'abonner"}
      </button>
      {error ? <p className="mt-2 text-xs text-flag">{error}</p> : null}
    </div>
  );
}

export default function PricingSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [audience, setAudience] = useState<Audience>("STUDENT");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");

  const plans =
    audience === "STUDENT"
      ? STUDENT_ORDER.map((code) => STUDENT_PLANS[code])
      : INSTITUTION_ORDER.map((code) => INSTITUTION_PLANS[code]);
  const features = audience === "STUDENT" ? STUDENT_PLAN_FEATURES : INSTITUTION_PLAN_FEATURES;
  const popularCode = audience === "STUDENT" ? "ESSENTIEL" : "STANDARD";

  return (
    <section id="tarifs" className="bg-surface-light py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            Tarifs
          </p>

          <h2 className="mt-4 font-serif text-4xl font-normal tracking-[-0.01em] text-ink">
            Un accompagnement adapté à{" "}
            <em className="text-accent-dark italic">chaque profil</em>
          </h2>

          <p className="mt-4 text-ink-muted">
            Analysez vos mémoires, détectez les faiblesses et préparez la soutenance avec
            l&apos;intelligence artificielle.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div className="inline-flex rounded-full border border-border-neutral bg-surface-neutral p-1">
            {(["STUDENT", "INSTITUTION"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setAudience(option);
                  if (option === "INSTITUTION") setBillingCycle("MONTHLY");
                }}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  audience === option
                    ? "bg-ink text-paper shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {option === "STUDENT" ? "Étudiant" : "Établissement"}
              </button>
            ))}
          </div>

          {audience === "STUDENT" ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border-neutral bg-surface-neutral p-1">
              {(["MONTHLY", "YEARLY"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBillingCycle(option)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
                    billingCycle === option
                      ? "bg-ink text-paper shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {option === "MONTHLY" ? "Mensuel" : "Annuel"}
                  {option === "YEARLY" ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        billingCycle === "YEARLY"
                          ? "bg-accent-lime text-ink"
                          : "bg-accent-lime/70 text-ink"
                      }`}
                    >
                      -{YEARLY_DISCOUNT_PERCENT}%
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const popular = plan.code === popularCode;
            const isFree = plan.code === "FREE";
            const price =
              audience === "STUDENT"
                ? billingCycle === "YEARLY"
                  ? plan.priceYearlyFcfa
                  : plan.priceMonthlyFcfa
                : plan.priceMonthlyFcfa;
            const priceSuffix =
              audience === "STUDENT" ? (billingCycle === "YEARLY" ? "/an" : "/mois") : "/mois";

            return (
              <div
                key={plan.code}
                className={`relative rounded-3xl border p-8 transition hover:-translate-y-1 ${
                  popular
                    ? "border-ink bg-ink text-paper shadow-xl shadow-ink/20"
                    : "border-border-neutral bg-surface-light shadow-sm shadow-ink/5 hover:shadow-lg hover:shadow-ink/10"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-lime px-4 py-1 text-xs font-medium text-ink">
                    Le plus choisi
                  </span>
                )}

                <h3 className="text-xl font-semibold">{plan.name}</h3>

                <p className={`mt-3 text-sm ${popular ? "text-paper/70" : "text-ink-muted"}`}>
                  {plan.description}
                </p>

                <div className="mt-8">
                  <span className="text-3xl font-semibold">
                    {isFree || !price ? "Gratuit" : formatFcfa(price)}
                  </span>
                  {!isFree && price ? (
                    <span className={`ml-1 text-sm ${popular ? "text-paper/60" : "text-ink-muted"}`}>
                      {priceSuffix}
                    </span>
                  ) : null}
                </div>

                {isFree ? (
                  <Link
                    href="/inscription"
                    className="mt-8 block w-full rounded-full bg-ink py-3 text-center text-sm font-medium text-paper transition hover:bg-ink/85"
                  >
                    Commencer gratuitement
                  </Link>
                ) : isAuthenticated ? (
                  <SubscribeButton planCode={plan.code} billingCycle={billingCycle} popular={popular} />
                ) : (
                  <Link
                    href="/inscription"
                    className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-medium transition ${
                      popular
                        ? "bg-accent-lime text-ink hover:brightness-95"
                        : "bg-ink text-paper hover:bg-ink/85"
                    }`}
                  >
                    S&apos;abonner
                  </Link>
                )}

                <ul className="mt-8 space-y-4">
                  {features[plan.code as keyof typeof features].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check
                        size={18}
                        className={popular ? "text-accent-on-dark" : "text-accent-dark"}
                      />
                      <span className={popular ? "text-paper/80" : "text-ink-muted"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
