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

// Pénalité par mémoire déjà assigné à un jury — appliquée au score de spécialité (0-1) avant
// tri. Choisie pour départager les jurys à spécialité équivalente par charge de travail (cas
// le plus fréquent en pratique : plusieurs jurys couvrant la même catégorie) sans jamais
// laisser la charge l'emporter sur une correspondance de spécialité nettement meilleure —
// voir workloadByJury ci-dessous, auparavant complètement ignoré de cette fonction alors que
// getInstitutionJuryWorkload existe déjà pour l'affichage de la fiche jury.
const WORKLOAD_PENALTY_PER_MEMOIRE = 0.12;

// Classe les jurys candidats par pertinence décroissante pour un thème donné, en tenant
// compte à la fois de la correspondance de spécialité et de la charge de travail actuelle
// (nombre de mémoires déjà assignés — voir getInstitutionJuryWorkload). Les jurys sans
// spécialité renseignée sont inclus en fin de liste (score 0) plutôt qu'exclus —
// l'établissement doit pouvoir assigner manuellement même sans correspondance.
export function suggestJurorsForCategory(
  category: string,
  jurors: JurorCandidate[],
  workloadByJury?: Map<string, unknown[]>,
): JurorSuggestion[] {
  return jurors
    .map((juror) => {
      const specialtyScore = juror.specialty ? similarity(category, juror.specialty) : 0;
      const workload = workloadByJury?.get(juror.id)?.length ?? 0;
      const score = Math.max(0, specialtyScore - workload * WORKLOAD_PENALTY_PER_MEMOIRE);
      return { ...juror, score };
    })
    .sort((a, b) => b.score - a.score);
}
