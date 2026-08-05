import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordForm } from "@/components/dashboard/PasswordForm";

export const metadata: Metadata = {
  title: "Changer de mot de passe — Thesus",
};

export default async function ChangerMotDePassePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion");
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface-neutral">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <AuthCard
            eyebrow="Sécurité du compte"
            title="Choisissez un nouveau mot de passe"
            subtitle="Votre compte a été créé avec un mot de passe temporaire. Pour continuer, choisissez un nouveau mot de passe."
          >
            <PasswordForm redirectTo="/dashboard" />
          </AuthCard>
        </div>
      </main>
      <Footer />
    </>
  );
}
