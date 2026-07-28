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
