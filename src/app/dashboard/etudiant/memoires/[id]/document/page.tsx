// src/app/dashboard/etudiant/memoires/[id]/document/page.tsx
import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { DocumentEditor } from "@/components/document/DocumentEditor";
import { documentRoomId } from "@/lib/y-sweet";
import { logDocumentIntegrityDrift } from "@/lib/document-integrity";
import { isDocumentContextTruncated } from "@/lib/ai-chat";

export default async function StudentDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flagExcerpt?: string }>;
}) {
  const { id } = await params;
  const { flagExcerpt } = await searchParams;
  const user = await requireRole("STUDENT");

  const memoire = await prisma.memoire.findUnique({ where: { id } });

  if (!memoire || memoire.studentId !== user.id) {
    notFound();
  }

  if (memoire.status !== "COMPLETED") {
    redirect(`/dashboard/etudiant/memoires/${memoire.id}`);
  }

  // Filet détectif — voir document-integrity.ts. Un écart ici peut simplement refléter une
  // édition en cours de l'étudiant lui-même sur un onglet précédent, ce n'est qu'un signal.
  after(() =>
    logDocumentIntegrityDrift(
      memoire.id,
      documentRoomId(memoire.id, memoire.documentRoomVersion),
      memoire.editableContent,
      "student_page_load",
    ),
  );

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
          documentRoomVersion={memoire.documentRoomVersion}
          userName={user.name}
          mode="edit"
          initialContent={memoire.editableContent ?? "<p></p>"}
          canRegenerate={memoire.fileType === "PDF"}
          initialChatMessages={chatMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
          }))}
          documentContextTruncated={isDocumentContextTruncated(memoire.editableContent)}
          flagExcerptOnLoad={flagExcerpt}
        />
      </div>
    </>
  );
}
