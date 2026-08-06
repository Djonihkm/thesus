// src/app/dashboard/etudiant/memoires/[id]/document/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { DocumentEditor } from "@/components/document/DocumentEditor";

export default async function StudentDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("STUDENT");

  const memoire = await prisma.memoire.findUnique({ where: { id } });

  if (!memoire || memoire.studentId !== user.id) {
    notFound();
  }

  if (memoire.status !== "COMPLETED") {
    redirect(`/dashboard/etudiant/memoires/${memoire.id}`);
  }

  const chatMessages = await prisma.aiChatMessage.findMany({
    where: { memoireId: memoire.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Mes mémoires", href: "/dashboard/etudiant/memoires" },
          { label: memoire.title, href: `/dashboard/etudiant/memoires/${memoire.id}` },
          { label: "Document" },
        ]}
      />

      <DashboardHeader
        eyebrow="Document"
        title={memoire.title}
        description="Éditez le contenu de votre mémoire. Le jury peut le consulter et l'annoter une fois votre dépôt terminé."
      />

      <div className="mt-8">
        <DocumentEditor
          memoireId={memoire.id}
          mode="edit"
          initialContent={memoire.editableContent ?? "<p></p>"}
          canRegenerate={memoire.fileType === "PDF"}
          initialChatMessages={chatMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
