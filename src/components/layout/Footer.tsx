import Link from "next/link";

const columns = [
  {
    title: "Produit",
    links: [
      { label: "Audit de mémoire", href: "#modules" },
      { label: "Anti-plagiat", href: "#modules" },
      { label: "Quiz étudiant", href: "#modules" },
      { label: "Simulation de jury", href: "#modules" },
    ],
  },
  {
    title: "Établissement",
    links: [
      { label: "Tarifs", href: "/tarifs" },
      { label: "Connexion", href: "/connexion" },
      { label: "Créer un compte", href: "/inscription" },
    ],
  },
  {
    title: "Contact",
    links: [{ label: "contact@thesus.fr", href: "mailto:contact@thesus.fr" }],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-dark bg-surface-dark">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-lg font-medium text-paper">Thesus</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper-muted">
              Le fil d&apos;Ariane académique, du dépôt du mémoire à la soutenance.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-medium text-paper">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-paper-muted transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-border-dark pt-8 text-sm text-paper-muted">
          © {new Date().getFullYear()} Thesus. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
