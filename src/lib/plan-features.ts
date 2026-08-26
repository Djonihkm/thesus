// src/lib/plan-features.ts
//
// Résumé en langage courant des limites de chaque plan (pricing-config.ts reste la source de
// vérité des valeurs numériques/booléennes ; ce fichier ne fait que les mettre en mots pour la
// page Tarifs et la section Abonnement de "Mon compte").
import type { StudentPlanCode, InstitutionPlanCode } from "@/lib/pricing-config";

export const STUDENT_PLAN_FEATURES: Record<StudentPlanCode, string[]> = {
  FREE: [
    "1 mémoire actif",
    "Audit complet du mémoire",
    "Anti-plagiat (score global)",
    "Quiz limité (5 questions)",
  ],
  ESSENTIEL: [
    "1 mémoire actif",
    "Anti-plagiat détaillé par passage",
    "Quiz illimité",
    "Simulation de jury IA",
    "Export PDF / DOCX",
  ],
  COMPLET: ["Mémoires illimités", "Tout Essentiel inclus", "Assistant IA de rédaction"],
};

export const INSTITUTION_PLAN_FEATURES: Record<InstitutionPlanCode, string[]> = {
  FREE: ["Jusqu'à 15 étudiants", "Gestion des thèmes", "Jusqu'à 3 jurys", "Assignation manuelle"],
  STANDARD: ["Jusqu'à 150 étudiants", "Jurys illimités", "Suggestion d'assignation automatique"],
  ETABLISSEMENT: ["Étudiants illimités", "Tout Standard inclus"],
};
