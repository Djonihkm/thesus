// src/lib/jury-assignment.ts
//
// Suggestion d'assignation jury <-> mémoire : compare le domaine/catégorie du thème du
// mémoire à la spécialité (User.specialty) de chaque jury de l'institution. Simple
// correspondance texte (égalité, inclusion, recouvrement de mots) — volontairement pas
// d'embeddings/IA pour cette itération, le besoin ne le justifie pas encore.
export interface JurorCandidate {
  id: string;
  name: string;
  specialty: string | null;
}

export interface JurorSuggestion extends JurorCandidate {
  score: number;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function wordSet(value: string): Set<string> {
  return new Set(normalize(value).split(/[^a-z0-9]+/).filter(Boolean));
}

function similarity(category: string, specialty: string): number {
  const normalizedCategory = normalize(category);
  const normalizedSpecialty = normalize(specialty);

  if (!normalizedCategory || !normalizedSpecialty) return 0;
  if (normalizedCategory === normalizedSpecialty) return 1;
  if (
    normalizedSpecialty.includes(normalizedCategory) ||
    normalizedCategory.includes(normalizedSpecialty)
  ) {
    return 0.75;
  }

  const categoryWords = wordSet(category);
  const specialtyWords = wordSet(specialty);
  if (categoryWords.size === 0 || specialtyWords.size === 0) return 0;

  let shared = 0;
  for (const word of categoryWords) {
    if (specialtyWords.has(word)) shared += 1;
  }

  return shared > 0 ? (0.5 * shared) / Math.max(categoryWords.size, specialtyWords.size) : 0;
}

// Classe les jurys candidats par pertinence décroissante pour un thème donné. Les jurys
// sans spécialité renseignée sont inclus en fin de liste (score 0) plutôt qu'exclus —
// l'établissement doit pouvoir assigner manuellement même sans correspondance.
export function suggestJurorsForCategory(
  category: string,
  jurors: JurorCandidate[],
): JurorSuggestion[] {
  return jurors
    .map((juror) => ({
      ...juror,
      score: juror.specialty ? similarity(category, juror.specialty) : 0,
    }))
    .sort((a, b) => b.score - a.score);
}
