import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { verifyEmailToken } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Confirmation de compte — Thesus",
};

export default async function VerifierEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verified = token ? await verifyEmailToken(token) : false;

  if (verified) {
    redirect("/connexion?confirmed=1");
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface-neutral">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <AuthCard
            eyebrow="Confirmation"
            title="Lien invalide ou expiré"
            subtitle="Ce lien de confirmation n'est plus valable. Reconnectez-vous pour en obtenir un nouveau, ou contactez-nous si le problème persiste."
          >
            <Button href="/connexion" tone="light" variant="primary" className="w-full">
              Retour à la connexion
            </Button>
          </AuthCard>
        </div>
      </main>
      <Footer />
    </>
  );
}
