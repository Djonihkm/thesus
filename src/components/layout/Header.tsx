import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MobileNav } from "@/components/layout/MobileNav";
import { auth } from "@/lib/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/[.06] bg-surface-light/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Thesus" width={239} height={133} className="h-8 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <a
            href="#modules"
            className="text-xs font-medium tracking-[1.5px] text-ink-muted uppercase transition-colors hover:text-ink"
          >
            Services
          </a>

          <Link
            href="#tarifs"
            className="text-xs font-medium tracking-[1.5px] text-ink-muted uppercase transition-colors hover:text-ink"
          >
            Tarifs
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-ink-muted sm:inline">
                {session.user.name}
              </span>

              <Link
                href="/dashboard"
                className="text-sm font-medium text-ink underline underline-offset-4 transition-colors hover:text-accent-dark"
              >
                Tableau de bord
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="hidden text-sm text-ink-muted transition-colors hover:text-ink sm:inline"
              >
                Connexion
              </Link>

              <Button href="/inscription" variant="accent">
                Créer un compte
              </Button>
            </>
          )}

          <MobileNav />
        </div>
      </div>
    </header>
  );
}