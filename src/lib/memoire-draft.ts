// src/lib/memoire-draft.ts
import { escapeHtml } from "@/lib/html";

// Squelette de départ pour un mémoire rédigé directement dans l'éditeur (voir
// createDraftMemoireAction) — une structure académique minimale pour donner un point de
// départ (sections vides à compléter), pas un plan détaillé imposé : l'étudiant reste libre
// de tout réorganiser dans l'éditeur.
export function buildDraftSkeleton(title: string): string {
  const safeTitle = escapeHtml(title);
  return [
    `<h1>${safeTitle}</h1>`,
    "<h2>Introduction</h2>",
    "<p></p>",
    "<h2>Chapitre 1</h2>",
    "<p></p>",
    "<h2>Chapitre 2</h2>",
    "<p></p>",
    "<h2>Conclusion</h2>",
    "<p></p>",
  ].join("");
}
