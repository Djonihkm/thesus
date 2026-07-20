import { requireRole } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function EtudiantDashboardPage() {
  const user = await requireRole("STUDENT");

  return (
    <main className="flex min-h-screen flex-col bg-surface-light">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <span className="text-sm font-medium tracking-wide text-accent">
              Espace étudiant
            </span>
            <h1 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-ink">
              Bonjour {user.name}
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">
              Le dépôt de votre mémoire, votre audit, votre rapport anti-plagiat et
              votre préparation au jury arriveront bientôt dans cet espace.
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
