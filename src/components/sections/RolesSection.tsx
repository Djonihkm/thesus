const roles = [
  {
    label: "Établissement",
    title: "Pilotage global",
    description:
      "Import des étudiants, vue d'ensemble sur les mémoires déposés et suivi des soutenances à venir.",
  },
  {
    label: "Jury",
    title: "Notation assistée",
    description:
      "Questions de soutenance prêtes à l'emploi, générées à partir de chaque mémoire, et grille de notation assistée.",
  },
  {
    label: "Étudiant",
    title: "Auto-évaluation",
    description:
      "Dépôt du mémoire, quiz de préparation et feedback complet avant de monter à la tribune.",
  },
];

export function RolesSection() {
  return (
    <section className="bg-surface-light">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-xl">
          <span className="text-sm font-medium tracking-wide text-accent">
            Trois espaces
          </span>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-ink">
            Un espace pour chaque rôle
          </h2>
        </div>

        <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-3">
          {roles.map((role) => (
            <div key={role.label} className="border-t border-accent pt-6">
              <span className="text-sm text-ink-muted">{role.label}</span>
              <h3 className="mt-3 text-xl font-medium text-ink">{role.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
