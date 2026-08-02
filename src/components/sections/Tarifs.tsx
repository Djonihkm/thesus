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
          <p className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            Tarifs
          </p>

          <h2 className="mt-4 font-serif text-4xl font-normal tracking-[-0.01em] text-ink">
            Un accompagnement adapté à{" "}
            <em className="text-accent-dark italic">chaque étudiant</em>
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
              className={`relative rounded-3xl border p-8 transition hover:-translate-y-1 ${
                plan.popular
                  ? "border-ink bg-ink text-paper shadow-xl shadow-ink/20"
                  : "border-border-neutral bg-surface-light shadow-sm shadow-ink/5 hover:shadow-lg hover:shadow-ink/10"
              }`}
            >

              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-lime px-4 py-1 text-xs font-medium text-ink">
                  Le plus choisi
                </span>
              )}

              <h3 className="text-xl font-semibold">
                {plan.name}
              </h3>

              <p className={`mt-3 text-sm ${
                plan.popular ? "text-paper/70" : "text-ink-muted"
              }`}>
                {plan.description}
              </p>


              <div className="mt-8">
                <span className="text-3xl font-semibold">
                  {plan.price}
                </span>
              </div>


              <button
                className={`mt-8 w-full rounded-full py-3 text-sm font-medium transition ${
                  plan.popular
                    ? "bg-accent-lime text-ink hover:brightness-95"
                    : "bg-ink text-paper hover:bg-ink/85"
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
                      className={plan.popular ? "text-accent-on-dark" : "text-accent-dark"}
                    />
                    <span className={
                      plan.popular
                        ? "text-paper/80"
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