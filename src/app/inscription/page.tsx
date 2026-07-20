import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Créer un compte — Thesus",
};

export default function InscriptionPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface-neutral">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <AuthCard
            eyebrow="Créer un compte"
            title="Rejoignez Thesus"
            subtitle="Un compte par établissement, jury ou étudiant, pour accéder à l'espace qui vous correspond."
          >
            <RegisterForm />
          </AuthCard>
        </div>
      </main>
      <Footer />
    </>
  );
}
