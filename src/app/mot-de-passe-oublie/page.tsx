import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Thesus",
};

export default function MotDePasseOubliePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface-neutral">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <AuthCard
            eyebrow="Mot de passe oublié"
            title="Réinitialisez votre mot de passe"
            subtitle="Indiquez votre adresse email : si un compte existe, vous recevrez un lien pour choisir un nouveau mot de passe."
          >
            <ForgotPasswordForm />
          </AuthCard>
        </div>
      </main>
      <Footer />
    </>
  );
}
