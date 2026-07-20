import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { Notice } from "@/components/auth/Notice";

export const metadata: Metadata = {
  title: "Connexion — Thesus",
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string; reset?: string }>;
}) {
  const { confirmed, reset } = await searchParams;

  const notice = confirmed
    ? "Votre compte est activé. Connectez-vous pour accéder à la plateforme."
    : reset
      ? "Votre mot de passe a été mis à jour. Connectez-vous avec votre nouveau mot de passe."
      : null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface-neutral">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <AuthCard
            eyebrow="Connexion"
            title="Ravis de vous revoir"
            subtitle="Accédez à votre espace pour suivre vos mémoires, vos rapports et vos soutenances."
          >
            {notice ? <Notice message={notice} /> : null}
            <LoginForm />
          </AuthCard>
        </div>
      </main>
      <Footer />
    </>
  );
}
