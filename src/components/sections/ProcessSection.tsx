const steps = [
  {
    index: "01",
    title: "Dépôt",
    description:
      "Un fichier PDF ou Word, déposé en quelques secondes depuis l'espace étudiant.",
  },
  {
    index: "02",
    title: "Analyse",
    description:
      "Structure, originalité, questions de jury et quiz générés automatiquement, sans intervention manuelle.",
  },
  {
    index: "03",
    title: "Résultats",
    description:
      "Note sur 20, rapport détaillé, certificat anti-plagiat et feedback réunis dans un seul espace.",
  },
];

export function ProcessSection() {
  return (
    <section className="bg-surface-neutral">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-xl">
          <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            Le parcours
          </span>
          <h2 className="mt-4 font-serif text-3xl font-normal tracking-[-0.01em] text-ink">
            Un seul dépôt, une <em className="text-accent-dark italic">soutenance préparée</em>
          </h2>
        </div>

        <div className="mt-16 grid gap-12 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.index} className="border-t border-ink/10 pt-6">
              <span className="font-serif text-sm text-accent-dark">{step.index}</span>
              <h3 className="mt-3 text-xl font-medium text-ink">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
