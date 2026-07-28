// src/lib/memoire-processing.ts
import { get } from "@vercel/blob";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { FileType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateAuditReport } from "@/lib/audit";
import { runPlagiarismCheck } from "@/lib/plagiarism";

async function fetchBlobBuffer(fileUrl: string): Promise<Buffer> {
  const result = await get(fileUrl, { access: "private" });
  if (!result || result.statusCode !== 200) {
    throw new Error("Impossible de récupérer le fichier déposé.");
  }
  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function extractText(fileUrl: string, fileType: FileType): Promise<string> {
  const buffer = await fetchBlobBuffer(fileUrl);

  if (fileType === "PDF") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function processMemoire(memoireId: string): Promise<void> {
  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire) return;

  let extractedText: string;
  try {
    extractedText = await extractText(memoire.fileUrl, memoire.fileType);
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

  await prisma.memoire.update({
    where: { id: memoireId },
    data: { status: "PROCESSING", extractedText },
  });

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
