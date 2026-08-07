// src/lib/document-export.ts
//
// Point commun aux exports PDF (Adobe HTMLToPDFJob) et DOCX (html-to-docx) : les deux
// partent du même editableContent, et doivent tous les deux résoudre les images du document
// — stockées sur Vercel Blob en accès privé, servies normalement via une route authentifiée
// (/api/memoires/[id]/document-images/[filename]) que ni Adobe ni html-to-docx ne peuvent
// atteindre depuis l'extérieur. On les récupère donc nous-mêmes côté serveur.
import { get } from "@vercel/blob";
import type { Memoire } from "@prisma/client";
import { escapeHtml } from "@/lib/html";
import { documentImagePathname } from "@/lib/document-images";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessMemoireDocument } from "@/lib/document-access";

export interface ResolvedDocumentImage {
  filename: string;
  buffer: Buffer;
  contentType: string;
}

function imageSrcPattern(memoireId: string): RegExp {
  return new RegExp(`/api/memoires/${memoireId}/document-images/([^"'\\s]+)`, "g");
}

export async function resolveDocumentImages(
  html: string,
  memoireId: string,
): Promise<ResolvedDocumentImage[]> {
  const filenames = new Set<string>();
  const pattern = imageSrcPattern(memoireId);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    filenames.add(match[1]);
  }
  if (filenames.size === 0) return [];

  const images = await Promise.all(
    Array.from(filenames).map(async (filename): Promise<ResolvedDocumentImage | null> => {
      const result = await get(documentImagePathname(memoireId, filename), { access: "private" });
      if (!result || result.statusCode !== 200) return null;

      const arrayBuffer = await new Response(result.stream).arrayBuffer();
      return {
        filename,
        buffer: Buffer.from(arrayBuffer),
        contentType: result.blob.contentType || "image/png",
      };
    }),
  );

  return images.filter((image): image is ResolvedDocumentImage => image !== null);
}

// Réécrit les src d'image internes vers un chemin relatif ("images/<filename>") — utilisé
// pour l'archive zip envoyée à Adobe (voir pdf-export.ts). Le nom de fichier peut contenir
// des caractères spéciaux issus de Vercel Blob (addRandomSuffix) : échappement regex requis.
export function rewriteImageSrcToRelative(html: string, memoireId: string): string {
  return html.replace(imageSrcPattern(memoireId), (_match, filename: string) => `images/${filename}`);
}

// Réécrit les src d'image internes en data URI base64 — utilisé pour html-to-docx (voir
// docx-export.ts), qui ne fait pas sa propre résolution réseau des images référencées.
export function rewriteImageSrcToDataUri(
  html: string,
  memoireId: string,
  images: ResolvedDocumentImage[],
): string {
  const byFilename = new Map(images.map((image) => [image.filename, image]));
  return html.replace(imageSrcPattern(memoireId), (match, filename: string) => {
    const image = byFilename.get(filename);
    if (!image) return match;
    return `data:${image.contentType};base64,${image.buffer.toString("base64")}`;
  });
}

const EXPORT_BASE_CSS = `
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 22pt; font-weight: 600; letter-spacing: -0.01em; }
  h2 { font-size: 16pt; font-weight: 600; margin-top: 1.5em; }
  h3 { font-size: 13pt; font-weight: 600; }
  p { margin: 0 0 1em; }
  ul, ol { padding-left: 1.5em; margin: 0 0 1em; }
  blockquote { border-left: 2px solid #ccc; padding-left: 1em; color: #555; margin: 0 0 1em; }
  table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; vertical-align: top; }
  th { background: #f5f5f3; font-weight: 600; }
  hr { border: none; border-top: 1px solid #ccc; margin: 2em 0; }
  mark { background: rgba(212, 168, 87, 0.4); }
`;

// Document HTML complet pour l'export — le contenu du corps porte déjà tous les styles
// pertinents en inline (alignement de texte, police, taille, alignement/largeur d'image,
// saut de page — voir les extensions Tiptap correspondantes) : cette feuille ne couvre que
// les éléments qui n'en ont jamais (typographie de base, tableaux, citations).
export function buildExportHtml(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${EXPORT_BASE_CSS}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

export function exportFilename(title: string, extension: "pdf" | "docx"): string {
  const safeTitle = title.trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120) || "memoire";
  return `${safeTitle}.${extension}`;
}

export type MemoireExportAccessResult = { error: string; status: number } | { memoire: Memoire };

// Vérification d'accès partagée par les deux routes d'export (PDF, DOCX) — même règle que
// le reste de la vue document (canAccessMemoireDocument), et un contenu vide n'a rien à
// exporter.
export async function loadMemoireForExport(memoireId: string): Promise<MemoireExportAccessResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Non authentifié.", status: 401 };
  }

  const [user, memoire] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.memoire.findUnique({ where: { id: memoireId } }),
  ]);

  if (!user || !memoire || !canAccessMemoireDocument(user, memoire)) {
    return { error: "Introuvable.", status: 404 };
  }
  if (!memoire.editableContent) {
    return { error: "Ce mémoire n'a pas encore de contenu à exporter.", status: 400 };
  }

  return { memoire };
}
