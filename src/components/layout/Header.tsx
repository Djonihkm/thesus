import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/[.06] bg-surface-light/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-medium tracking-tight text-ink">
          Thesus
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <a
            href="#modules"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Services
          </a>

          <Link
            href="#tarifs"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Tarifs
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="text-sm">
                {session.user.name}
              </span>

              <Link href="/dashboard">Tableau de bord</Link>
            </>
          ) : (
            <>
              <Link href="/connexion">Connexion</Link>

              <Button href="/inscription">
                Créer un compte
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}