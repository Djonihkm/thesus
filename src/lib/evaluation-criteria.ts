// src/lib/evaluation-criteria.ts
export const EVALUATION_CRITERIA_LABELS = [
  "Maîtrise du sujet",
  "Qualité de la présentation",
  "Réponses aux questions du jury",
  "Rigueur méthodologique",
] as const;

export interface EvaluationCriterion {
  label: string;
  score: number;
}
