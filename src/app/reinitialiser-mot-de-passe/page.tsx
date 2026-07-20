import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — Thesus",
};

export default async function ReinitialiserMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface-neutral">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <AuthCard
            eyebrow="Nouveau mot de passe"
            title="Choisissez un nouveau mot de passe"
            subtitle="Minimum 8 caractères."
          >
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <div className="flex flex-col gap-4 text-center">
                <p className="text-ink-muted">Ce lien de réinitialisation est invalide.</p>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-sm text-ink underline underline-offset-4"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            )}
          </AuthCard>
        </div>
      </main>
      <Footer />
    </>
  );
}
