// src/app/dashboard/jury/memoires/[id]/document/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { DocumentEditor } from "@/components/document/DocumentEditor";

export default async function JuryDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("JURY");

  const memoire = await prisma.memoire.findUnique({
    where: { id },
    include: { student: { select: { name: true } } },
  });

  if (!memoire || !user.institutionId || memoire.institutionId !== user.institutionId) {
    notFound();
  }

  if (memoire.status !== "COMPLETED") {
    redirect("/dashboard/jury/memoires");
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Mémoires", href: "/dashboard/jury/memoires" },
          { label: memoire.title, href: `/dashboard/jury/memoires/${memoire.id}` },
          { label: "Document" },
        ]}
      />

      <DashboardHeader
        eyebrow="Document"
        title={memoire.title}
        description={`${memoire.student.name} · surlignez, soulignez et commentez les passages à discuter.`}
      />

      <div className="mt-8">
        <DocumentEditor
          memoireId={memoire.id}
          documentRoomVersion={memoire.documentRoomVersion}
          userName={user.name}
          mode="annotate"
          initialContent={memoire.editableContent ?? "<p></p>"}
        />
      </div>
    </>
  );
}
