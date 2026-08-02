import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import { AuditIcon, PlagiarismIcon, QuizIcon } from "@/components/icons";

export async function Hero() {
  const session = await auth();
  return (
    <section className="relative overflow-hidden hero-gradient">
      <div className="pointer-events-none absolute -top-16 left-[12%] h-72 w-72 rounded-full bg-accent-lime/20 blur-3xl" />
      <div className="pointer-events-none absolute top-6 right-[8%] h-96 w-96 rounded-full bg-accent-on-dark/25 blur-3xl" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pt-16 pb-8 text-center sm:pt-24">
        <span className="text-xs font-medium tracking-[1.5px] text-accent-lime uppercase">
          Évaluation académique, avant le jour J
        </span>
        <h1 className="max-w-2xl font-serif text-4xl leading-[1.1] font-normal tracking-[-0.01em] text-paper sm:text-6xl">
          Trouve ton <em className="text-accent-lime italic">fil d&apos;Ariane</em>{" "}
          académique
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-paper">
          Audit de structure, détection de plagiat, quiz de préparation et
          questions de jury générées à partir de ton mémoire : un seul dépôt,
          un accompagnement complet jusqu&apos;à la soutenance.
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row">
          {session?.user ? (
            <Button href="/dashboard/etudiant/memoires" variant="accent">
              Déposer mon mémoire
            </Button>
          ) : (
            <Button href="/connexion" variant="accent">
              Connexion
            </Button>
          )}
          <Button href="#services" tone="dark" variant="outline">
            Découvrir les services
          </Button>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pt-6 pb-20 sm:pb-28">
        <div className="flex flex-wrap items-center justify-center gap-5 sm:flex-nowrap sm:gap-0">
          <div className="w-40 shrink-0 -rotate-6 rounded-2xl bg-paper p-4 shadow-xl shadow-black/20 sm:-mr-4 sm:translate-y-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
              <AuditIcon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xs font-medium text-ink">Audit de mémoire</p>
            <p className="mt-1 font-serif text-xl text-accent-dark">16.5/20</p>
          </div>

          <div className="z-10 w-44 shrink-0 rotate-3 rounded-2xl bg-ink p-4 shadow-xl shadow-black/30 sm:-mx-2 sm:-translate-y-2">
            <p className="text-xs font-medium tracking-[1.5px] text-accent-lime uppercase">
              Propulsé par l&apos;IA
            </p>
            <p className="mt-2 text-sm leading-snug text-paper">
              Analyse académique générée en quelques minutes.
            </p>
          </div>

          <div className="z-20 w-40 shrink-0 -rotate-3 rounded-2xl bg-paper p-4 shadow-xl shadow-black/20 sm:-mx-2 sm:translate-y-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
              <QuizIcon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xs font-medium text-ink">Quiz généré</p>
            <p className="mt-1 font-serif text-xl text-accent-dark">8/10</p>
          </div>

          <div className="w-40 shrink-0 rotate-[5deg] rounded-2xl bg-paper p-4 shadow-xl shadow-black/20 sm:-ml-4 sm:translate-y-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
              <PlagiarismIcon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xs font-medium text-ink">Anti-plagiat</p>
            <p className="mt-1 font-serif text-xl text-accent-dark">3%</p>
          </div>
        </div>
      </div>
    </section>
  );
}
