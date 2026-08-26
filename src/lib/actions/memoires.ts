"use server";

import { after } from "next/server";
import { del, list } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyInstitution } from "@/lib/notifications";
import { processMemoire } from "@/lib/memoire-processing";
import { buildDraftSkeleton } from "@/lib/memoire-draft";
import { canCreateMemoire } from "@/lib/subscription";
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
  // Par défaut true (comportement historique) — l'étudiant peut décocher le rattachement
  // dans l'UI pour créer volontairement un mémoire indépendant de son thème actif.
  linkToActiveTheme?: boolean;
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

  const fileType = fileTypeFromMimeType(input.mimeType);
  if (!fileType) {
    return { error: "Type de fichier non pris en charge." };
  }

  const memoireLimit = await canCreateMemoire(user.id);
  if (!memoireLimit.allowed) {
    return { error: memoireLimit.reason };
  }

  // Le dépôt n'est plus conditionné à un thème validé (audit/quiz/anti-plagiat/simulation
  // de jury sont un usage libre, indépendant du circuit de validation institutionnel) — voir
  // src/lib/actions/themes.ts. Si l'étudiant a un thème actif et n'a pas explicitement
  // décoché le rattachement dans l'UI, le mémoire s'y rattache automatiquement ; sinon il
  // reste sans thème et pourra être rattaché après coup (voir
  // attachCurrentThemeToMemoireAction). currentTheme n'est renseigné que via une demande de
  // sélection approuvée, donc toujours VALIDATED quand présent — pas besoin de re-vérifier
  // son statut ici.
  const shouldLinkTheme = input.linkToActiveTheme ?? true;
  const memoire = await prisma.memoire.create({
    data: {
      title: titleFromFileName(input.fileName),
      fileUrl: input.blobUrl,
      fileType,
      studentId: user.id,
      institutionId: user.institutionId,
      themeId: shouldLinkTheme ? (user.currentTheme?.id ?? null) : null,
    },
  });

  after(() => processMemoire(memoire.id));

  await notifyInstitution(
    user.institutionId,
    "Un étudiant a déposé un nouveau mémoire.",
    "/dashboard/etablissement/memoires",
  );

  return { success: true, memoireId: memoire.id };
}

// Étudiant : démarre un mémoire vide directement dans l'éditeur, sans fichier source — même
// parcours découplé du thème que le dépôt par upload (accessible avec ou sans thème actif).
// Pas de fichier à traiter, donc pas de processMemoire ni de statut PENDING/PROCESSING
// intermédiaire : le mémoire est directement COMPLETED, avec un squelette de départ dans
// editableContent, prêt à ouvrir dans l'éditeur immédiatement après création.
export async function createDraftMemoireAction(input: {
  title: string;
  // Par défaut true (comportement historique) — voir createMemoireAction.
  linkToActiveTheme?: boolean;
}): Promise<MemoireActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant pour créer un mémoire." };
  }

  const title = input.title.trim();
  if (!title) {
    return { error: "Indiquez un titre pour votre mémoire." };
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
        "Votre établissement n'est pas encore rattaché à la plateforme. Contactez le support pour débloquer la création de mémoire.",
    };
  }

  const memoireLimit = await canCreateMemoire(user.id);
  if (!memoireLimit.allowed) {
    return { error: memoireLimit.reason };
  }

  const shouldLinkTheme = input.linkToActiveTheme ?? true;
  const memoire = await prisma.memoire.create({
    data: {
      title,
      source: "DRAFTED",
      status: "COMPLETED",
      studentId: user.id,
      institutionId: user.institutionId,
      themeId: shouldLinkTheme ? (user.currentTheme?.id ?? null) : null,
      editableContent: buildDraftSkeleton(title),
    },
  });

  return { success: true, memoireId: memoire.id };
}

export type DeleteMemoireActionState = {
  error?: string;
  success?: boolean;
};

// Suppression ouverte à tous les statuts (plus seulement FAILED) — nécessaire pour
// nettoyer d'anciens mémoires de test antérieurs au système de thèmes. Seul le
// propriétaire peut supprimer son mémoire. Le nettoyage couvre : fichier original +
// images du document sur Vercel Blob, et tous les enregistrements liés (rapports, quiz,
// simulation de jury, évaluations, assignation) puisqu'aucune de ces relations n'a de
// cascade en base. Les commentaires du document (DocumentComment), eux, cascadent
// automatiquement via le schéma (onDelete: Cascade sur memoireId) — pas de ligne manuelle
// nécessaire ici. Le document Y-Sweet associé n'a rien à nettoyer explicitement : sans
// suppression d'un mémoire, plus personne ne redemandera jamais son docId.
export async function deleteMemoireAction(memoireId: string): Promise<DeleteMemoireActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }

  try {
    const documentImages = await list({ prefix: `memoires/${memoireId}/images/` });
    // memoire.fileUrl est absent pour un mémoire DRAFTED (jamais de fichier source).
    const urlsToDelete = [memoire.fileUrl, ...documentImages.blobs.map((blob) => blob.url)].filter(
      (url): url is string => Boolean(url),
    );
    if (urlsToDelete.length > 0) {
      await del(urlsToDelete);
    }
  } catch {
    // Le nettoyage du stockage ne doit pas empêcher la suppression de l'enregistrement —
    // un fichier orphelin sur Blob est un moindre mal comparé à un mémoire bloqué en base.
  }

  await prisma.$transaction([
    prisma.memoireAssignment.deleteMany({ where: { memoireId } }),
    prisma.defenseEvaluation.deleteMany({ where: { memoireId } }),
    prisma.auditReport.deleteMany({ where: { memoireId } }),
    prisma.plagiarismReport.deleteMany({ where: { memoireId } }),
    prisma.quizAttempt.deleteMany({ where: { quiz: { memoireId } } }),
    prisma.quizQuestion.deleteMany({ where: { quiz: { memoireId } } }),
    prisma.quiz.deleteMany({ where: { memoireId } }),
    prisma.juryQuestion.deleteMany({ where: { jurySimulation: { memoireId } } }),
    prisma.jurySimulation.deleteMany({ where: { memoireId } }),
    prisma.memoire.delete({ where: { id: memoireId } }),
  ]);

  return { success: true };
}

// Rattache le thème actif de l'étudiant à un mémoire déjà déposé sans thème — cas d'un
// étudiant qui a déposé librement puis obtenu un thème validé ensuite. Ne s'applique qu'à
// un mémoire encore sans thème (pas de réattribution/écrasement ici) et seulement si un
// thème actif existe (nécessairement VALIDATED, voir createMemoireAction).
export async function attachCurrentThemeToMemoireAction(
  memoireId: string,
): Promise<MemoireActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const [memoire, user] = await Promise.all([
    prisma.memoire.findUnique({ where: { id: memoireId } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currentTheme: { select: { id: true } } },
    }),
  ]);

  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }
  if (memoire.themeId) {
    return { error: "Ce mémoire est déjà rattaché à un thème." };
  }
  if (!user?.currentTheme) {
    return { error: "Vous n'avez pas de thème actif à rattacher — choisissez-en un d'abord." };
  }

  await prisma.memoire.update({
    where: { id: memoireId },
    data: { themeId: user.currentTheme.id },
  });

  return { success: true };
}
