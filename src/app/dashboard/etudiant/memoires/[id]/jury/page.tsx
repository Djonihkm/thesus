// src/app/dashboard/etudiant/memoires/[id]/jury/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { GenerateModuleButton } from "@/components/dashboard/GenerateModuleButton";
import { JuryQuestionList } from "@/components/dashboard/JuryQuestionList";
import { generateJuryAction } from "@/lib/actions/jury";

export const maxDuration = 60;

export default async function JuryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

  const memoire = await prisma.memoire.findUnique({
    where: { id },
    include: {
      jurySimulation: {
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!memoire || memoire.studentId !== user.id) {
    notFound();
  }

  if (memoire.status !== "COMPLETED") {
    redirect(`/dashboard/etudiant/memoires/${memoire.id}`);
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Mes mémoires", href: "/dashboard/etudiant/memoires" },
          { label: memoire.title, href: `/dashboard/etudiant/memoires/${memoire.id}` },
          { label: "Simulation de jury" },
        ]}
      />

      <DashboardHeader
        eyebrow="Simulation de jury"
        title={memoire.title}
        description="Questions de soutenance générées à partir du contenu de votre mémoire, organisées par thème."
      />

      <div className="mt-10">
        {!memoire.jurySimulation ? (
          <GenerateModuleButton
            action={generateJuryAction}
            memoireId={memoire.id}
            label="Générer les questions de jury"
            pendingLabel="Génération en cours…"
            description="Cela prend quelques secondes — une dizaine de questions réparties par thème seront générées à partir de votre mémoire."
          />
        ) : (
          <JuryQuestionList memoireId={memoire.id} questions={memoire.jurySimulation.questions} />
        )}
      </div>
    </>
  );
}
