import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="bg-surface-light">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-12 pb-24 sm:pt-16 sm:pb-32 lg:grid-cols-[3fr_2fr] lg:gap-16">
        <div className="flex flex-col items-start gap-8">
          <span className="text-sm font-medium tracking-wide text-accent">
            Évaluation académique, avant le jour J
          </span>
          <h1 className="max-w-xl text-4xl leading-[1.1] font-medium tracking-[-0.02em] text-ink sm:text-6xl">
            Trouve ton fil d&apos;Ariane académique
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-muted">
            Audit de structure, détection de plagiat, quiz de préparation et
            questions de jury générées à partir de ton mémoire : un seul dépôt,
            un accompagnement complet jusqu&apos;à la soutenance.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button href="/deposer" tone="light" variant="primary">
              Déposer mon mémoire
            </Button>
            <Button href="#modules" tone="light" variant="outline">
              Découvrir les modules
            </Button>
          </div>
        </div>

        <Image
          src="/illustrations/illustrationHero.png"
          alt="Illustration d'une personne examinant un mémoire à la loupe"
          width={929}
          height={910}
          priority
          sizes="(min-width: 1024px) 40vw, 90vw"
          className="mx-auto h-auto w-full max-w-sm lg:max-w-none"
        />
      </div>
    </section>
  );
}
