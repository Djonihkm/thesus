import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ModulesSection } from "@/components/sections/ModulesSection";
import { RolesSection } from "@/components/sections/RolesSection";
import { FinalCta } from "@/components/sections/FinalCta";
import  PricingSection  from "@/components/sections/Tarifs";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <ProcessSection />
        <ModulesSection />
        <RolesSection />
        <PricingSection />
        {session?.user ? <></> : <FinalCta />}
      </main>
      <Footer />
    </>
  );
}
