import {
  AuditIcon,
  JuryIcon,
  PlagiarismIcon,
  QuizIcon,
} from "@/components/icons";

const modules = [
  {
    icon: AuditIcon,
    title: "Audit de mémoire",
    description:
      "Structure, cohérence argumentative et qualité rédactionnelle passées au crible, pour une note sur 20 et des recommandations concrètes.",
  },
  {
    icon: PlagiarismIcon,
    title: "Anti-plagiat",
    description:
      "Comparaison à une base de publications académiques, un rapport détaillé et un certificat authentifiable par QR code.",
  },
  {
    icon: QuizIcon,
    title: "Quiz étudiant",
    description:
      "QCU, vrai/faux et texte à trous générés à partir du contenu déposé, pour s'auto-évaluer avant la remise.",
  },
  {
    icon: JuryIcon,
    title: "Simulation de jury",
    description:
      "Les questions qu'un jury pourrait poser, générées à partir du mémoire, pour arriver en soutenance sans surprise.",
  },
];

export function ModulesSection() {
  return (
    <section id="services" className="bg-surface-light">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-xl">
          <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            Les services de Thesus
          </span>
          <h2 className="mt-4 font-serif text-3xl font-normal tracking-[-0.01em] text-ink">
            Quatre regards sur un <em className="text-accent-dark italic">même mémoire</em>
          </h2>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border-neutral bg-surface-neutral px-6 py-8 shadow-sm shadow-ink/5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
                <Icon className="h-5 w-5 text-accent-dark" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-ink">{title}</h3>
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
