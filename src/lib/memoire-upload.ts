// src/lib/memoire-upload.ts
import { FileType } from "@prisma/client";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
} as const satisfies Record<string, FileType>;

export const ALLOWED_CONTENT_TYPES = Object.keys(ALLOWED_MIME_TYPES);

export type AllowedMimeType = keyof typeof ALLOWED_MIME_TYPES;

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return mimeType in ALLOWED_MIME_TYPES;
}

export function fileTypeFromMimeType(mimeType: string): FileType | null {
  return isAllowedMimeType(mimeType) ? ALLOWED_MIME_TYPES[mimeType] : null;
}

export function titleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^./\\]+$/, "");
  return withoutExtension.trim() || fileName;
}

// L'upload passe directement client -> Vercel Blob (voir blob-upload/route.ts) : le
// Content-Type déclaré par le navigateur n'est jamais vérifié contre le contenu réel du
// fichier avant ce point. Ici, au premier contact serveur avec les octets (voir
// memoire-processing.ts), on vérifie la signature binaire réelle avant de passer le fichier
// à mammoth/Adobe PDF Services — un fichier renommé en .pdf/.docx mais dont le contenu réel
// diffère est rejeté ici plutôt que transmis tel quel à ces parseurs.
const FILE_SIGNATURES: Record<FileType, readonly (readonly number[])[]> = {
  // "%PDF-"
  PDF: [[0x25, 0x50, 0x44, 0x46, 0x2d]],
  // DOCX est un zip OOXML : en-tête local ZIP standard, ou zip vide/scindé (rare en pratique
  // mais valide) — les trois signatures PK reconnues par le format.
  DOCX: [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
    [0x50, 0x4b, 0x07, 0x08],
  ],
};

function startsWithSignature(buffer: Buffer, signature: readonly number[]): boolean {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

export function matchesDeclaredFileType(buffer: Buffer, fileType: FileType): boolean {
  return FILE_SIGNATURES[fileType].some((signature) => startsWithSignature(buffer, signature));
}
