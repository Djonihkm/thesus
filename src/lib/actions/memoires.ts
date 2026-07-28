"use server";

import { after } from "next/server";
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

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "Compte introuvable." };
  }
  if (!user.institutionId) {
    return {
      error:
        "Votre établissement n'est pas encore rattaché à la plateforme. Contactez le support pour débloquer le dépôt de mémoire.",
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
    },
  });

  after(() => processMemoire(memoire.id));

  return { success: true, memoireId: memoire.id };
}
