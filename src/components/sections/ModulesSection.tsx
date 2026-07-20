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
    <section id="modules" className="bg-surface-dark">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-xl">
          <span className="text-sm font-medium tracking-wide text-accent">
            Les modules
          </span>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-paper">
            Quatre regards sur un même mémoire
          </h2>
        </div>

        <div className="mt-16 grid border-t border-l border-border-dark sm:grid-cols-2 lg:grid-cols-4">
          {modules.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="border-r border-b border-border-dark px-6 py-10"
            >
              <Icon className="h-6 w-6 text-accent" />
              <h3 className="mt-6 text-lg font-medium text-paper">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-paper-muted">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
