import { describe, it, expect } from "vitest";
import {
  isAllowedMimeType,
  fileTypeFromMimeType,
  titleFromFileName,
  matchesDeclaredFileType,
} from "./memoire-upload";

const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // "%PDF-1.7"
const DOCX_MAGIC_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]); // ZIP local header
const NOT_A_DOCUMENT = Buffer.from("<html><body>ceci n'est pas un document</body></html>");

describe("isAllowedMimeType / fileTypeFromMimeType", () => {
  it("accepts application/pdf", () => {
    expect(isAllowedMimeType("application/pdf")).toBe(true);
    expect(fileTypeFromMimeType("application/pdf")).toBe("PDF");
  });

  it("accepts the DOCX MIME type", () => {
    const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    expect(isAllowedMimeType(docxMime)).toBe(true);
    expect(fileTypeFromMimeType(docxMime)).toBe("DOCX");
  });

  it("rejects an unrelated MIME type", () => {
    expect(isAllowedMimeType("image/png")).toBe(false);
    expect(fileTypeFromMimeType("image/png")).toBeNull();
  });
});

describe("titleFromFileName", () => {
  it("strips a single extension", () => {
    expect(titleFromFileName("Memoire_Final.docx")).toBe("Memoire_Final");
  });

  it("falls back to the full filename if nothing remains after stripping", () => {
    expect(titleFromFileName(".docx")).toBe(".docx");
  });
});

// Régression directe sur le correctif "type de fichier vérifié seulement via le
// Content-Type déclaré" (voir AUDIT.md) — un fichier renommé mais au contenu différent doit
// être rejeté avant tout passage à mammoth/Adobe PDF Services.
describe("matchesDeclaredFileType", () => {
  it("accepts a real PDF declared as PDF", () => {
    expect(matchesDeclaredFileType(PDF_MAGIC_BYTES, "PDF")).toBe(true);
  });

  it("accepts a real DOCX (ZIP) declared as DOCX", () => {
    expect(matchesDeclaredFileType(DOCX_MAGIC_BYTES, "DOCX")).toBe(true);
  });

  it("rejects a non-PDF file declared as PDF", () => {
    expect(matchesDeclaredFileType(NOT_A_DOCUMENT, "PDF")).toBe(false);
  });

  it("rejects a non-DOCX file declared as DOCX", () => {
    expect(matchesDeclaredFileType(NOT_A_DOCUMENT, "DOCX")).toBe(false);
  });

  it("rejects a PDF renamed and declared as DOCX", () => {
    expect(matchesDeclaredFileType(PDF_MAGIC_BYTES, "DOCX")).toBe(false);
  });

  it("rejects a buffer shorter than the signature", () => {
    expect(matchesDeclaredFileType(Buffer.from([0x25, 0x50]), "PDF")).toBe(false);
  });
});
