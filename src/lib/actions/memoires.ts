"use server";

import { after } from "next/server";
import { del, list } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processMemoire } from "@/lib/memoire-processing";
import {
  MAX_FILE_SIZE_BYTES,
  fileTypeFromMimeType,
  isAllowedMimeType,
  titleFromFileName,
} from "@/lib/memoire-upload";

export type MemoireActionState = {
  error?: string;
  success?: boolean;
  memoireId?: string;
};

export async function createMemoireAction(input: {
  blobUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}): Promise<MemoireActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant pour déposer un mémoire." };
  }

  if (!isAllowedMimeType(input.mimeType)) {
    return { error: "Seuls les fichiers PDF et Word (.docx) sont acceptés." };
  }
  if (input.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Le fichier dépasse la taille maximale autorisée (20 Mo)." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { currentTheme: true },
  });
  if (!user) {
    return { error: "Compte introuvable." };
  }
  if (!user.institutionId) {
    return {
      error:
        "Votre établissement n'est pas encore rattaché à la plateforme. Contactez le support pour débloquer le dépôt de mémoire.",
    };
  }
  // Le thème doit être choisi/proposé puis validé avant tout dépôt (voir
  // src/lib/actions/themes.ts) — vérifié ici aussi, pas seulement côté UI, au cas où
  // l'action serait appelée directement.
  if (!user.currentTheme || user.currentTheme.status !== "VALIDATED") {
    return {
      error: "Choisissez d'abord un thème validé par votre établissement avant de déposer votre mémoire.",
    };
  }

  const fileType = fileTypeFromMimeType(input.mimeType);
  if (!fileType) {
    return { error: "Type de fichier non pris en charge." };
  }

  const memoire = await prisma.memoire.create({
    data: {
      title: titleFromFileName(input.fileName),
      fileUrl: input.blobUrl,
      fileType,
      studentId: user.id,
      institutionId: user.institutionId,
      themeId: user.currentTheme.id,
    },
  });

  after(() => processMemoire(memoire.id));

  return { success: true, memoireId: memoire.id };
}

export type DeleteMemoireActionState = {
  error?: string;
  success?: boolean;
};

// Suppression réservée aux mémoires en échec (FAILED) : un mémoire qui a réussi (ou est en
// cours) ne doit pas pouvoir disparaître silencieusement (rapports, évaluations,
// assignation jury potentiellement associés). Nettoie le fichier original sur Vercel Blob
// ainsi que les images du document éditable, qui ont pu être générées même en cas
// d'échec de l'audit (l'extraction/la conversion peut avoir réussi avant l'échec).
export async function deleteMemoireAction(memoireId: string): Promise<DeleteMemoireActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }
  if (memoire.status !== "FAILED") {
    return { error: "Seul un mémoire en échec peut être supprimé." };
  }

  try {
    const documentImages = await list({ prefix: `memoires/${memoireId}/images/` });
    const urlsToDelete = [memoire.fileUrl, ...documentImages.blobs.map((blob) => blob.url)];
    await del(urlsToDelete);
  } catch {
    // Le nettoyage du stockage ne doit pas empêcher la suppression de l'enregistrement —
    // un fichier orphelin sur Blob est un moindre mal comparé à un mémoire bloqué en base.
  }

  await prisma.$transaction([
    prisma.memoireAssignment.deleteMany({ where: { memoireId } }),
    prisma.memoire.delete({ where: { id: memoireId } }),
  ]);

  return { success: true };
}
