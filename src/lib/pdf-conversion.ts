// src/lib/pdf-conversion.ts
//
// Convertit un PDF déposé en DOCX structuré via l'API Adobe PDF Services, pour
// pouvoir ensuite le faire passer par le même pipeline mammoth que les dépôts DOCX
// (extractedText + editableContent) — un seul chemin de traitement pour les deux
// formats après cette étape. Pas de fallback local (LibreOffice ou équivalent) :
// l'hébergement cible (Vercel, serverless) ne permet pas d'exécuter un tel binaire,
// donc un échec Adobe fait échouer la conversion, gérée par l'appelant.
import { Readable } from "node:stream";
import {
  PDFServices,
  ServicePrincipalCredentials,
  MimeType,
  ExportPDFJob,
  ExportPDFParams,
  ExportPDFTargetFormat,
  ExportPDFResult,
  ServiceApiError,
  ServiceUsageError,
  SDKError,
} from "@adobe/pdfservices-node-sdk";

export class PdfConversionError extends Error {}

export async function convertPdfToDocx(buffer: Buffer): Promise<Buffer> {
  const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new PdfConversionError(
      "La conversion du document PDF n'est pas configurée (identifiants Adobe PDF Services manquants).",
    );
  }

  try {
    const credentials = new ServicePrincipalCredentials({ clientId, clientSecret });
    const pdfServices = new PDFServices({ credentials });

    const inputAsset = await pdfServices.upload({
      readStream: Readable.from(buffer),
      mimeType: MimeType.PDF,
    });

    const job = new ExportPDFJob({
      inputAsset,
      params: new ExportPDFParams({ targetFormat: ExportPDFTargetFormat.DOCX }),
    });

    const pollingURL = await pdfServices.submit({ job });
    const response = await pdfServices.getJobResult({ pollingURL, resultType: ExportPDFResult });

    const resultAsset = response.result?.asset;
    if (!resultAsset) {
      throw new PdfConversionError("La conversion du document PDF n'a retourné aucun résultat.");
    }

    const streamAsset = await pdfServices.getContent({ asset: resultAsset });
    return await streamToBuffer(streamAsset.readStream);
  } catch (error) {
    if (error instanceof PdfConversionError) throw error;

    if (
      error instanceof ServiceApiError ||
      error instanceof ServiceUsageError ||
      error instanceof SDKError
    ) {
      throw new PdfConversionError(
        "La conversion du document PDF est impossible pour le moment (service indisponible ou quota atteint). Réessayez plus tard ou contactez le support.",
      );
    }

    throw new PdfConversionError(
      "La conversion du document PDF a échoué. Réessayez plus tard ou contactez le support.",
    );
  }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
