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

export interface CriterionAnchor {
  range: string;
  description: string;
}

export interface CriterionGuidance {
  label: (typeof EVALUATION_CRITERIA_LABELS)[number];
  description: string;
  anchors: CriterionAnchor[];
}

// Repères synthétiques pour noter de façon cohérente d'un jury à l'autre — pas un barème
// détaillé, juste ce qui distingue typiquement une note faible/moyenne/haute sur chaque
// critère.
export const EVALUATION_CRITERIA_GUIDANCE: CriterionGuidance[] = [
  {
    label: "Maîtrise du sujet",
    description:
      "Compréhension du sujet, exactitude des connaissances mobilisées, capacité à en discuter les limites.",
    anchors: [
      {
        range: "16-20",
        description:
          "Maîtrise fine du sujet, recul critique réel, répond avec aisance à une question imprévue.",
      },
      {
        range: "10-13",
        description:
          "Connaissances correctes mais restitution proche du mémoire, peu de recul face à l'inattendu.",
      },
      {
        range: "< 8",
        description:
          "Confusions sur des notions centrales, incapable de justifier un choix clé du travail.",
      },
    ],
  },
  {
    label: "Qualité de la présentation",
    description: "Clarté de l'exposé oral, structure, support visuel, gestion du temps.",
    anchors: [
      {
        range: "16-20",
        description: "Exposé clair et bien rythmé, support qui renforce le propos, temps respecté.",
      },
      {
        range: "10-13",
        description: "Compréhensible mais rythme inégal, support surchargé ou sous-exploité, timing limite.",
      },
      {
        range: "< 8",
        description: "Exposé décousu, difficile à suivre, gestion du temps largement hors cadre.",
      },
    ],
  },
  {
    label: "Réponses aux questions du jury",
    description: "Pertinence et précision des réponses, capacité à être challengé sans se dérober.",
    anchors: [
      {
        range: "16-20",
        description:
          "Réponses précises et directes, reconnaît honnêtement une incertitude, engage le débat.",
      },
      {
        range: "10-13",
        description: "Réponses partielles, quelques hésitations, tendance à revenir au propos préparé.",
      },
      {
        range: "< 8",
        description: "Réponses évasives ou hors sujet, incapable de défendre un choix du mémoire.",
      },
    ],
  },
  {
    label: "Rigueur méthodologique",
    description:
      "Solidité de la méthode (protocole, collecte, raisonnement), justification des choix, limites assumées.",
    anchors: [
      {
        range: "16-20",
        description: "Méthode rigoureuse et justifiée, limites explicitement assumées, résultats nuancés.",
      },
      {
        range: "10-13",
        description: "Méthode décrite mais choix peu justifiés, limites peu ou pas discutées.",
      },
      {
        range: "< 8",
        description: "Méthode absente, incohérente, ou inadaptée à l'objectif annoncé.",
      },
    ],
  },
];
