import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";



export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-surface-light">
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Mentions légales
        </h1>

        <div className="mt-10 space-y-10 text-ink-muted">
          <section>
            <h2 className="text-xl font-semibold text-ink">
              1. Éditeur du site
            </h2>

            <p className="mt-3 leading-7">
              Le présent site et l&apos;application Thesus sont édités par :
            </p>

            <p className="mt-3 leading-7">
              <strong className="text-ink">Thesus</strong>
              <br />
              Responsable de publication : Djoni OUEDANOU
              <br />
              Email : luciejerom@gmail.com
              <br />
              Adresse : Zoca, maison blanche
            </p>

            <p className="mt-3 leading-7">
              Thesus est une plateforme numérique destinée à accompagner les
              étudiants dans l&apos;analyse, l&apos;amélioration et la
              préparation de leurs travaux académiques.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">
              2. Objet du service
            </h2>

            <p className="mt-3 leading-7">
              Thesus propose des outils utilisant l&apos;intelligence
              artificielle afin d&apos;aider les étudiants à analyser leurs
              mémoires, obtenir des recommandations et préparer leurs
              soutenances.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">
              3. Propriété intellectuelle
            </h2>

            <p className="mt-3 leading-7">
              L&apos;ensemble des éléments présents sur Thesus (interface, logo,
              design, textes, fonctionnalités et code source) sont protégés par
              les lois relatives à la propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">
              4. Responsabilité
            </h2>

            <p className="mt-3 leading-7">
              Les résultats générés par Thesus constituent une aide à
              l&apos;amélioration académique et ne remplacent pas
              l&apos;évaluation officielle d&apos;un établissement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">5. Contact</h2>

            <p className="mt-3 leading-7">
              Pour toute question :
              <br />
              Email : contact@thesus.fr
            </p>
          </section>
        </div>
      </section>
        <Footer />
    </main>
  );
}
