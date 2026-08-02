// src/lib/document-images.ts
//
// Convertit les images embarquées d'un DOCX en fichiers Vercel Blob à accès privé,
// plutôt que le comportement par défaut de mammoth (base64 inline) : sans extension
// Image côté TipTap ces <img> auraient de toute façon été perdus au parsing, et en base64
// elles auraient alourdi editableContent (colonne texte) de façon incontrôlée. Les images
// restent donc soumises au même contrôle d'accès que le reste du mémoire (route de
// service dédiée), au lieu d'être servies en clair.
import { put } from "@vercel/blob";
import mammoth from "mammoth";

export function documentImagePathname(memoireId: string, filename: string): string {
  return `memoires/${memoireId}/images/${filename}`;
}

export function documentImageSrc(memoireId: string, filename: string): string {
  return `/api/memoires/${memoireId}/document-images/${filename}`;
}

export function createDocumentImageConverter(memoireId: string) {
  let index = 0;

  return mammoth.images.imgElement(async (image) => {
    const currentIndex = index++;
    const buffer = await image.readAsBuffer();
    const extension = image.contentType.split("/")[1] ?? "bin";

    const blob = await put(documentImagePathname(memoireId, `${currentIndex}.${extension}`), buffer, {
      access: "private",
      contentType: image.contentType,
      addRandomSuffix: true,
    });

    const filename = blob.pathname.split("/").pop();
    if (!filename) {
      throw new Error("Échec de l'enregistrement d'une image du document.");
    }

    return { src: documentImageSrc(memoireId, filename) };
  });
}
