import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="bg-surface-neutral">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-24 sm:items-center sm:text-center">
        <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.01em] text-ink sm:text-4xl">
          Prêt à structurer vos soutenances ?
        </h2>
        <p className="max-w-xl leading-relaxed text-ink-muted">
          Rejoignez les établissements qui préparent leurs étudiants avant le
          jour J, du premier dépôt jusqu&apos;à la dernière question du jury.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button href="/inscription" tone="light" variant="primary">
            Créer un compte
          </Button>
          <Button href="/contact" tone="light" variant="outline">
            Contacter l&apos;équipe
          </Button>
        </div>
      </div>
    </section>
  );
}
