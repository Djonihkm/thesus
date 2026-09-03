// src/lib/tiptap/find-text-range.ts
//
// Recherche d'un extrait de texte dans le document ProseMirror pour y appliquer un mark
// programmatiquement (voir plagiarism-flag-mark.ts) — nécessaire parce que les positions
// détectées par le module anti-plagiat (PlagiarismPassage.studentStart/studentEnd) sont des
// offsets dans extractedText (texte brut extrait par mammoth au dépôt), pas des positions
// ProseMirror : ces deux représentations divergent (normalisation d'espaces différente,
// document potentiellement modifié depuis l'analyse). Recherche par contenu plutôt que par
// offset — plus robuste, mais peut échouer si le passage a changé depuis ; l'appelant doit
// gérer explicitement le cas "introuvable", jamais supposer un succès silencieux.
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Convertit un offset dans le texte NORMALISÉ (espaces multiples réduits à un seul, bords
// coupés) en offset dans le texte BRUT correspondant — nécessaire car positions[] est indexé
// sur le texte brut (un caractère par entrée), pas sur le texte normalisé utilisé pour la
// recherche elle-même.
function rawOffsetFromNormalizedOffset(raw: string, normalizedOffset: number): number {
  let rawIndex = 0;
  let normalizedCount = 0;
  let lastWasSpace = true;
  // Avance jusqu'au premier caractère non-espace du texte brut, comme normalize() le ferait
  // via trim() en tête.
  while (rawIndex < raw.length && /\s/.test(raw[rawIndex])) rawIndex++;

  while (rawIndex < raw.length && normalizedCount < normalizedOffset) {
    const isSpace = /\s/.test(raw[rawIndex]);
    if (isSpace) {
      if (!lastWasSpace) normalizedCount++;
    } else {
      normalizedCount++;
    }
    lastWasSpace = isSpace;
    rawIndex++;
  }
  return rawIndex;
}

export function findTextRangeInDoc(
  doc: ProseMirrorNode,
  needle: string,
): { from: number; to: number } | null {
  const normalizedNeedle = normalize(needle);
  if (!normalizedNeedle) return null;

  let text = "";
  const positions: number[] = [];
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) {
        positions.push(pos + i);
      }
      text += node.text;
    } else if (node.isBlock && text.length > 0 && !text.endsWith(" ")) {
      // Sépare les blocs par un espace pour ne pas fusionner deux mots de paragraphes
      // distincts en un seul token de recherche — position de repli sur le début du bloc,
      // jamais utilisée comme borne exacte d'un match (la recherche ne peut de toute façon
      // pas matcher exactement sur ce caractère de séparation synthétique).
      positions.push(pos);
      text += " ";
    }
    return true;
  });

  const normalizedText = normalize(text);
  const normalizedIdx = normalizedText.indexOf(normalizedNeedle);
  if (normalizedIdx === -1) return null;

  const rawStart = rawOffsetFromNormalizedOffset(text, normalizedIdx);
  // rawEndExclusive pointe juste APRÈS le dernier caractère du besoin (comme un index de fin
  // de slice) — le dernier caractère réel du match est donc à rawEndExclusive - 1, jamais
  // rawEndExclusive lui-même (qui est déjà le premier caractère suivant, potentiellement un
  // espace ou le début du mot suivant).
  const rawEndExclusive = rawOffsetFromNormalizedOffset(text, normalizedIdx + normalizedNeedle.length);
  const rawLastCharIndex = Math.min(rawEndExclusive, text.length) - 1;

  const from = positions[rawStart];
  const to = positions[rawLastCharIndex];
  if (from === undefined || to === undefined || from > to) return null;

  return { from, to: to + 1 };
}
