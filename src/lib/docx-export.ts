// src/lib/docx-export.ts
//
// Génère un DOCX à partir du HTML de l'éditeur via html-to-docx (pure JS, pas de binaire
// externe — compatible serverless). Contrairement à l'export PDF, les images sont intégrées
// en data URI base64 plutôt qu'en archive zip : html-to-docx ne fait pas sa propre
// résolution réseau des <img src>, une data URI est le mécanisme le plus simple qu'il
// supporte nativement.
import HTMLtoDOCX from "html-to-docx";
import { resolveDocumentImages, rewriteImageSrcToDataUri, buildExportHtml } from "@/lib/document-export";

export class DocxExportError extends Error {}

const ONE_INCH_IN_TWIPS = 1440;

export async function convertHtmlToDocx(
  bodyHtml: string,
  title: string,
  memoireId: string,
): Promise<Buffer> {
  try {
    const images = await resolveDocumentImages(bodyHtml, memoireId);
    const embeddedHtml = rewriteImageSrcToDataUri(bodyHtml, memoireId, images);
    const fullHtml = buildExportHtml(embeddedHtml, title);

    const result = await HTMLtoDOCX(fullHtml, null, {
      title,
      margins: {
        top: ONE_INCH_IN_TWIPS,
        bottom: ONE_INCH_IN_TWIPS,
        left: ONE_INCH_IN_TWIPS,
        right: ONE_INCH_IN_TWIPS,
      },
    });

    return Buffer.from(result as ArrayBuffer);
  } catch {
    throw new DocxExportError("L'export DOCX a échoué. Réessayez plus tard.");
  }
}
