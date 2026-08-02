import { Building2, GraduationCap, Users } from "lucide-react";

const roles = [
  {
    icon: Building2,
    label: "Établissement",
    title: "Pilotage global",
    description:
      "Import des étudiants, vue d'ensemble sur les mémoires déposés et suivi des soutenances à venir.",
  },
  {
    icon: Users,
    label: "Jury",
    title: "Notation assistée",
    description:
      "Questions de soutenance prêtes à l'emploi, générées à partir de chaque mémoire, et grille de notation assistée.",
  },
  {
    icon: GraduationCap,
    label: "Étudiant",
    title: "Auto-évaluation",
    description:
      "Dépôt du mémoire, quiz de préparation et feedback complet avant de monter à la tribune.",
  },
];

export function RolesSection() {
  return (
    <section className="bg-surface-neutral">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-xl">
          <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            Trois espaces
          </span>
          <h2 className="mt-4 font-serif text-3xl font-normal tracking-[-0.01em] text-ink">
            Un espace pour <em className="text-accent-dark italic">chaque rôle</em>
          </h2>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {roles.map(({ icon: Icon, label, title, description }) => (
            <div
              key={label}
              className="rounded-2xl border border-border-neutral bg-surface-light px-6 py-8 shadow-sm shadow-ink/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
                <Icon className="h-5 w-5 text-accent-dark" />
              </div>
              <span className="mt-6 block text-xs font-medium tracking-[1.5px] text-ink-muted uppercase">
                {label}
              </span>
              <h3 className="mt-2 text-lg font-medium text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
