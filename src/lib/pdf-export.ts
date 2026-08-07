// src/lib/pdf-export.ts
//
// Génère un PDF à partir du HTML de l'éditeur via l'API Adobe PDF Services (déjà utilisée
// pour la conversion PDF -> DOCX au dépôt, voir pdf-conversion.ts) — pas de dépendance
// lourde type Puppeteer/Chromium, incompatible avec l'hébergement serverless (Vercel).
import { Readable } from "node:stream";
import JSZip from "jszip";
import {
  PDFServices,
  ServicePrincipalCredentials,
  MimeType,
  HTMLToPDFJob,
  HTMLToPDFParams,
  PageLayout,
  HTMLToPDFResult,
  ServiceApiError,
  ServiceUsageError,
  SDKError,
} from "@adobe/pdfservices-node-sdk";
import { resolveDocumentImages, rewriteImageSrcToRelative, buildExportHtml } from "@/lib/document-export";

export class PdfExportError extends Error {}

// Adobe accepte du HTML statique "text/html" tel quel, mais nos images sont sur Vercel Blob
// en accès privé (voir document-export.ts) — Adobe ne peut pas les récupérer lui-même.
// L'archive zip (index.html + images/) est le mécanisme documenté pour un contenu HTML avec
// assets locaux.
async function buildHtmlZip(bodyHtml: string, title: string, memoireId: string): Promise<Buffer> {
  const images = await resolveDocumentImages(bodyHtml, memoireId);
  const relativeHtml = rewriteImageSrcToRelative(bodyHtml, memoireId);
  const fullHtml = buildExportHtml(relativeHtml, title);

  const zip = new JSZip();
  zip.file("index.html", fullHtml);
  const imagesFolder = zip.folder("images");
  for (const image of images) {
    imagesFolder?.file(image.filename, image.buffer);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}

export async function convertHtmlToPdf(
  bodyHtml: string,
  title: string,
  memoireId: string,
): Promise<Buffer> {
  const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new PdfExportError(
      "L'export PDF n'est pas configuré (identifiants Adobe PDF Services manquants).",
    );
  }

  try {
    const zipBuffer = await buildHtmlZip(bodyHtml, title, memoireId);

    const credentials = new ServicePrincipalCredentials({ clientId, clientSecret });
    const pdfServices = new PDFServices({ credentials });

    const inputAsset = await pdfServices.upload({
      readStream: Readable.from(zipBuffer),
      mimeType: MimeType.ZIP,
    });

    const job = new HTMLToPDFJob({
      inputAsset,
      params: new HTMLToPDFParams({
        // A4 plutôt que le format lettre US par défaut du SDK — convention académique
        // française, cohérente avec le reste de la plateforme.
        pageLayout: new PageLayout({ pageHeight: 11.69, pageWidth: 8.27 }),
      }),
    });

    const pollingURL = await pdfServices.submit({ job });
    const response = await pdfServices.getJobResult({ pollingURL, resultType: HTMLToPDFResult });

    const resultAsset = response.result?.asset;
    if (!resultAsset) {
      throw new PdfExportError("L'export PDF n'a retourné aucun résultat.");
    }

    const streamAsset = await pdfServices.getContent({ asset: resultAsset });
    return await streamToBuffer(streamAsset.readStream);
  } catch (error) {
    if (error instanceof PdfExportError) throw error;

    if (
      error instanceof ServiceApiError ||
      error instanceof ServiceUsageError ||
      error instanceof SDKError
    ) {
      throw new PdfExportError(
        "L'export PDF est impossible pour le moment (service indisponible ou quota atteint). Réessayez plus tard.",
      );
    }

    throw new PdfExportError("L'export PDF a échoué. Réessayez plus tard.");
  }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
