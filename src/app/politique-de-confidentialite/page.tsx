import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="min-h-screen bg-surface-light">
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Politique de confidentialité
        </h1>

        <div className="mt-10 space-y-10 text-ink-muted">
          <section>
            <h2 className="text-xl font-semibold text-ink">1. Introduction</h2>

            <p className="mt-3 leading-7">
              La protection de vos données personnelles est une priorité pour
              Thesus. Cette politique explique comment vos données sont
              collectées et utilisées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">
              2. Données collectées
            </h2>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Informations liées au compte utilisateur</li>
              <li>Documents académiques déposés</li>
              <li>Données techniques nécessaires au fonctionnement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">
              3. Utilisation des données
            </h2>

            <p className="mt-3 leading-7">
              Les données collectées permettent de :
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Créer et gérer votre compte</li>
              <li>Fournir les fonctionnalités d&apos;analyse IA</li>
              <li>Améliorer la qualité du service</li>
              <li>Sécuriser la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">
              4. Confidentialité des documents
            </h2>

            <p className="mt-3 leading-7">
              Les mémoires et documents envoyés sur Thesus restent confidentiels
              et ne sont pas accessibles aux autres utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">
              5. Intelligence artificielle
            </h2>

            <p className="mt-3 leading-7">
              Certaines fonctionnalités utilisent l&apos;intelligence
              artificielle. Les résultats générés sont des recommandations et
              doivent être vérifiés avant utilisation académique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">6. Vos droits</h2>

            <p className="mt-3 leading-7">
              Vous pouvez demander l&apos;accès, la modification ou la
              suppression de vos données personnelles en nous contactant.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink">7. Contact</h2>

            <p className="mt-3 leading-7">
              Email : teamsamuraiconsulting@gmail.com
            </p>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
