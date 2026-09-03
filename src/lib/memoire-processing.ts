// src/lib/memoire-processing.ts
import { get } from "@vercel/blob";
import mammoth from "mammoth";
import { FileType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateAuditReport } from "@/lib/audit";
import { runPlagiarismCheck } from "@/lib/plagiarism";
import { convertPdfToDocx, PdfConversionError } from "@/lib/pdf-conversion";
import { createDocumentImageConverter } from "@/lib/document-images";
import { matchesDeclaredFileType } from "@/lib/memoire-upload";

export async function fetchBlobBuffer(fileUrl: string): Promise<Buffer> {
  const result = await get(fileUrl, { access: "private" });
  if (!result || result.statusCode !== 200) {
    throw new Error("Impossible de récupérer le fichier déposé.");
  }
  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Normalise le fichier déposé en DOCX : un DOCX est utilisé tel quel, un PDF est converti
// via Adobe PDF Services (structure — titres, paragraphes, listes — préservée, contrairement
// à une extraction de texte brut). Un seul chemin mammoth ensuite pour les deux formats.
export async function toDocxBuffer(buffer: Buffer, fileType: FileType): Promise<Buffer> {
  if (fileType === "PDF") {
    return convertPdfToDocx(buffer);
  }
  return buffer;
}

export async function processMemoire(memoireId: string): Promise<void> {
  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  // Un mémoire DRAFTED (rédigé directement dans l'éditeur, voir createDraftMemoireAction)
  // n'a pas de fichier source et n'est jamais passé à cette fonction — garde-fou défensif
  // seulement, pas un chemin normal.
  if (!memoire || !memoire.fileUrl || !memoire.fileType) return;

  let docxBuffer: Buffer;
  try {
    const buffer = await fetchBlobBuffer(memoire.fileUrl);
    if (!matchesDeclaredFileType(buffer, memoire.fileType)) {
      throw new Error(
        "Le contenu du fichier ne correspond pas au type déclaré (PDF/DOCX) — dépôt rejeté.",
      );
    }
    docxBuffer = await toDocxBuffer(buffer, memoire.fileType);
  } catch (error) {
    await prisma.memoire.update({
      where: { id: memoireId },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof PdfConversionError || error instanceof Error
            ? error.message
            : "Échec de la préparation du document déposé.",
      },
    });
    return;
  }

  let extractedText: string;
  try {
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    extractedText = result.value;
    if (!extractedText.trim()) {
      throw new Error("Aucun texte n'a pu être extrait du document.");
    }
  } catch (error) {
    await prisma.memoire.update({
      where: { id: memoireId },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Échec de l'extraction du texte du document.",
      },
    });
    return;
  }

  // Version éditable "vivante" du mémoire — un échec ici est non bloquant (même logique
  // que l'anti-plagiat) : la page document affichera un message de repli plutôt que de
  // faire échouer tout le traitement pour une fonctionnalité secondaire.
  const editableContent = await mammoth
    .convertToHtml(
      { buffer: docxBuffer },
      { convertImage: createDocumentImageConverter(memoireId) },
    )
    .then((result) => result.value)
    .catch(() => null);

  try {
    await prisma.memoire.update({
      where: { id: memoireId },
      data: { status: "PROCESSING", extractedText, editableContent },
    });
  } catch (error) {
    // Sans ce garde-fou, un échec transitoire de cette écriture laissait le mémoire bloqué
    // en PENDING/PROCESSING pour toujours : le seul recours pour l'étudiant était de
    // supprimer et redéposer, sans jamais savoir pourquoi.
    await prisma.memoire
      .update({
        where: { id: memoireId },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Échec de l'enregistrement du texte extrait.",
        },
      })
      .catch(() => {
        // Si même cette écriture de repli échoue, il n'y a plus rien à faire ici — la base
        // est indisponible, pas seulement cette requête.
      });
    return;
  }

  try {
    const auditResult = await generateAuditReport(extractedText);

    await prisma.auditReport.create({
      data: {
        memoireId,
        score: auditResult.score,
        structureScore: auditResult.structureScore,
        coherenceScore: auditResult.coherenceScore,
        writingQualityScore: auditResult.writingQualityScore,
        recommendations: auditResult.recommendations as unknown as Prisma.InputJsonValue,
      },
    });

    try {
      await runPlagiarismCheck(memoireId, extractedText);
    } catch {
      // La vérification anti-plagiat est secondaire : un échec ne doit pas faire
      // basculer tout le mémoire en FAILED alors que l'audit, lui, a réussi.
    }

    await prisma.memoire.update({
      where: { id: memoireId },
      data: { status: "COMPLETED" },
    });
  } catch (error) {
    await prisma.memoire.update({
      where: { id: memoireId },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Échec de la génération du rapport d'audit.",
      },
    });
  }
}
