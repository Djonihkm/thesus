"use server";

import { randomUUID } from "node:crypto";
import mammoth from "mammoth";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchBlobBuffer, toDocxBuffer } from "@/lib/memoire-processing";
import { PdfConversionError } from "@/lib/pdf-conversion";
import { createDocumentImageConverter, documentImagePathname, documentImageSrc } from "@/lib/document-images";

export type SaveDocumentActionState = {
  error?: string;
  success?: boolean;
};

export async function saveDocumentContentAction(
  memoireId: string,
  html: string,
): Promise<SaveDocumentActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }

  await prisma.memoire.update({
    where: { id: memoireId },
    data: { editableContent: html },
  });

  return { success: true };
}

export type RegenerateDocumentActionState = {
  error?: string;
  success?: boolean;
};

// Reconvertit le fichier PDF original en repassant par Adobe PDF Services + mammoth,
// pour les mémoires dont le contenu éditable a été généré par l'ancienne méthode
// (reconstruction de paragraphes depuis pdf-parse, sans structure et parfois tronquée).
// Fait aussi pointer le mémoire vers un document Y-Sweet neuf (documentRoomVersion) : le
// document Yjs existant contient l'ancien contenu figé (le nouveau contenu n'y serait
// injecté qu'en tant qu'ajout, pas un remplacement propre — les CRDT ne "vident" pas un
// document), donc les commentaires/annotations déjà déposés sur ce mémoire sont perdus —
// c'est la contrepartie nécessaire pour que la régénération soit visible dans l'éditeur.
export async function regenerateDocumentContentAction(
  memoireId: string,
): Promise<RegenerateDocumentActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }

  if (memoire.fileType !== "PDF" || !memoire.fileUrl) {
    return { error: "La régénération n'est nécessaire que pour les dépôts PDF." };
  }

  try {
    const buffer = await fetchBlobBuffer(memoire.fileUrl);
    const docxBuffer = await toDocxBuffer(buffer, memoire.fileType);

    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer: docxBuffer }),
      mammoth.convertToHtml(
        { buffer: docxBuffer },
        { convertImage: createDocumentImageConverter(memoireId) },
      ),
    ]);

    if (!textResult.value.trim()) {
      return { error: "Aucun texte n'a pu être extrait du document." };
    }

    await prisma.$transaction([
      prisma.memoire.update({
        where: { id: memoireId },
        data: {
          extractedText: textResult.value,
          editableContent: htmlResult.value,
          documentRoomVersion: { increment: 1 },
        },
      }),
      prisma.documentComment.deleteMany({ where: { memoireId } }),
    ]);

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof PdfConversionError
          ? error.message
          : "La régénération du document a échoué. Réessayez plus tard.",
    };
  }
}

export type UploadDocumentImageActionState = {
  error?: string;
  url?: string;
};

// Insertion d'une nouvelle image pendant l'édition (distincte des images déjà présentes
// dans le document déposé, extraites par createDocumentImageConverter) — même stockage
// privé, même route de service.
export async function uploadDocumentImageAction(
  memoireId: string,
  formData: FormData,
): Promise<UploadDocumentImageActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return { error: "Fichier image invalide." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.type.split("/")[1] ?? "bin";

  const blob = await put(
    documentImagePathname(memoireId, `${randomUUID()}.${extension}`),
    buffer,
    { access: "private", contentType: file.type, addRandomSuffix: true },
  );

  const filename = blob.pathname.split("/").pop();
  if (!filename) {
    return { error: "Échec de l'enregistrement de l'image." };
  }

  return { url: documentImageSrc(memoireId, filename) };
}
