import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ModulesSection } from "@/components/sections/ModulesSection";
import { RolesSection } from "@/components/sections/RolesSection";
import { FinalCta } from "@/components/sections/FinalCta";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <ProcessSection />
        <ModulesSection />
        <RolesSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
