import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TwoToneCard } from "@/components/sections/TwoToneCard";

export function FinalCta() {
  return (
    <section className="bg-surface-light py-24">
      <div className="mx-auto max-w-6xl px-6">
        <TwoToneCard
          dark={
            <>
              <span className="text-xs font-medium tracking-[1.5px] text-accent-lime uppercase">
                Prêt à commencer ?
              </span>
              <h2 className="mt-4 font-serif text-3xl font-normal tracking-[-0.01em] sm:text-4xl">
                Structurez{" "}
                <em className="text-accent-on-dark italic">vos soutenances</em>
              </h2>
              <p className="mt-4 max-w-sm leading-relaxed text-paper-muted">
                Rejoignez les établissements qui préparent leurs étudiants avant
                le jour J, du premier dépôt jusqu&apos;à la dernière question du
                jury.
              </p>
            </>
          }
          light={
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href="/inscription" variant="accent">
                  <span className="flex items-center gap-2">
                    Créer un compte
                    <ArrowRight size={16} />
                  </span>
                </Button>
                <Button href="/contact" tone="light" variant="outline">
                  Contacter l&apos;équipe
                </Button>
              </div>
              <p className="text-xs text-ink-muted">
                Créer un compte est gratuit et ne prend qu&apos;une minute.
              </p>
            </div>
          }
        />
      </div>
    </section>
  );
}
