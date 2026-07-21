import { Check } from "lucide-react";

const plans = [
  {
    name: "Essentiel",
    price: "2 500 FCFA",
    description: "Pour vérifier la qualité de votre mémoire avant dépôt.",
    features: [
      "Audit de mémoire IA",
      "Note sur 20",
      "Recommandations personnalisées",
      "Rapport de correction",
    ],
    popular: false,
  },
  {
    name: "Mémoire Pro",
    price: "5 000 FCFA",
    description: "L'accompagnement complet pour un mémoire solide.",
    features: [
      "Audit complet du mémoire",
      "Analyse anti-plagiat",
      "Certificat authentifiable QR Code",
      "Quiz d'auto-évaluation",
      "Suggestions d'amélioration",
    ],
    popular: true,
  },
  {
    name: "Soutenance",
    price: "10 000 FCFA",
    description: "Préparez-vous comme devant un vrai jury.",
    features: [
      "Tout le pack Mémoire Pro",
      "Simulation de jury IA",
      "Questions probables du jury",
      "Préparation aux réponses",
      "Analyse finale avant soutenance",
    ],
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section id="tarifs" className="bg-surface-light py-24">
      <div className="mx-auto max-w-6xl px-6">

        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Tarifs
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
            Un accompagnement adapté à chaque étudiant
          </h2>

          <p className="mt-4 text-ink-muted">
            Analysez votre mémoire, détectez les faiblesses et préparez votre
            soutenance avec l&apos;intelligence artificielle.
          </p>
        </div>


        <div className="mt-16 grid gap-8 md:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition ${
                plan.popular
                  ? "border-accent bg-surface-dark text-white"
                  : "border-black/[.08] bg-white"
              }`}
            >

              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-medium text-black">
                  Le plus choisi
                </span>
              )}

              <h3 className="text-xl font-semibold">
                {plan.name}
              </h3>

              <p className={`mt-3 text-sm ${
                plan.popular ? "text-white/70" : "text-ink-muted"
              }`}>
                {plan.description}
              </p>


              <div className="mt-8">
                <span className="text-3xl font-semibold">
                  {plan.price}
                </span>
              </div>


              <button
                className={`mt-8 w-full rounded-xl py-3 text-sm font-medium transition ${
                  plan.popular
                    ? "bg-accent text-black hover:opacity-90"
                    : "bg-black text-white hover:bg-black/80"
                }`}
              >
                Choisir cette offre
              </button>


              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Check
                      size={18}
                      className="text-accent"
                    />
                    <span className={
                      plan.popular
                        ? "text-white/80"
                        : "text-ink-muted"
                    }>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}