import Image from "next/image";
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
    title: "Étudiant",
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
            <Image
              src="/logo-white.png"
              alt="Thesus"
              width={240}
              height={133}
              loading="eager"
              className="h-8 w-auto"
            />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper-muted">
              Le fil d&apos;Ariane académique, du dépôt du mémoire à la
              soutenance.
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
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border-dark pt-8 sm:flex-row">
          <p className="text-sm text-paper-muted">
            © {new Date().getFullYear()} Thesus. Tous droits réservés.
          </p>

          <nav>
            <ul className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-sm text-paper-muted transition-colors hover:text-paper"
                >
                  Mentions légales
                </Link>
              </li>

              <li>
                <Link
                  href="/politique-de-confidentialite"
                  className="text-sm text-paper-muted transition-colors hover:text-paper"
                >
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
