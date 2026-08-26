// src/lib/pricing-config.ts
//
// Source unique de vérité pour les plans et leurs tarifs — modifier une valeur ici suffit,
// rien d'autre à toucher dans le reste du code. Les lignes Plan en base sont synchronisées
// depuis ces constantes (voir syncPlansFromConfig dans src/lib/subscription.ts), jamais
// éditées à la main directement en base.
//
// MONTANTS PROVISOIRES — placeholders FCFA à ajuster une fois la stratégie de prix réelle
// validée par le responsable. Aucune conséquence ailleurs dans le code si ces chiffres
// changent : ils ne sont lus que d'ici (config Checkout Stripe comprise).

export type StudentPlanCode = "FREE" | "ESSENTIEL" | "COMPLET";
export type InstitutionPlanCode = "FREE" | "STANDARD" | "ETABLISSEMENT";
export type BillingCycle = "MONTHLY" | "YEARLY";

export interface StudentPlanLimits {
  // null = illimité
  maxActiveMemoires: number | null;
  // Score global toujours visible (les 3 plans) ; le détail par passage (extraits comparés
  // côte à côte) est ce que ce flag conditionne — voir plagiat/page.tsx.
  plagiarismPassageDetail: boolean;
  quizMaxQuestions: number | null;
  jurySimulation: boolean;
  exportPdfDocx: boolean;
  aiWritingAssistant: boolean;
}

export interface InstitutionPlanLimits {
  maxStudents: number | null;
  maxJurys: number | null;
  autoJuryAssignment: boolean;
}

interface PlanDefinitionBase {
  name: string;
  description: string;
  // FCFA, montant entier (le FCFA n'a pas de sous-unité usuelle) — null si l'option n'existe
  // pas pour ce plan (Free, ou pas d'offre annuelle pour les plans établissement).
  priceMonthlyFcfa: number | null;
  priceYearlyFcfa: number | null;
}

export interface StudentPlanDefinition extends PlanDefinitionBase {
  role: "STUDENT";
  code: StudentPlanCode;
  limits: StudentPlanLimits;
}

export interface InstitutionPlanDefinition extends PlanDefinitionBase {
  role: "INSTITUTION";
  code: InstitutionPlanCode;
  limits: InstitutionPlanLimits;
}

export type PlanDefinition = StudentPlanDefinition | InstitutionPlanDefinition;

export const STUDENT_PLANS: Record<StudentPlanCode, StudentPlanDefinition> = {
  FREE: {
    role: "STUDENT",
    code: "FREE",
    name: "Free",
    description: "Pour découvrir Thesus sur un premier mémoire.",
    priceMonthlyFcfa: null,
    priceYearlyFcfa: null,
    limits: {
      maxActiveMemoires: 1,
      plagiarismPassageDetail: false,
      quizMaxQuestions: 5,
      jurySimulation: false,
      exportPdfDocx: false,
      aiWritingAssistant: false,
    },
  },
  ESSENTIEL: {
    role: "STUDENT",
    code: "ESSENTIEL",
    name: "Essentiel",
    description: "Tous les modules d'analyse pour préparer un mémoire solide.",
    priceMonthlyFcfa: 2_000, // provisoire
    priceYearlyFcfa: 15_000, // provisoire
    limits: {
      maxActiveMemoires: 1,
      plagiarismPassageDetail: true,
      quizMaxQuestions: null,
      jurySimulation: true,
      exportPdfDocx: true,
      aiWritingAssistant: false,
    },
  },
  COMPLET: {
    role: "STUDENT",
    code: "COMPLET",
    name: "Complet",
    description: "Mémoires illimités et assistant de rédaction IA.",
    priceMonthlyFcfa: 4_000, // provisoire
    priceYearlyFcfa: 30_000, // provisoire
    limits: {
      maxActiveMemoires: null,
      plagiarismPassageDetail: true,
      quizMaxQuestions: null,
      jurySimulation: true,
      exportPdfDocx: true,
      aiWritingAssistant: true,
    },
  },
};

export const INSTITUTION_PLANS: Record<InstitutionPlanCode, InstitutionPlanDefinition> = {
  FREE: {
    role: "INSTITUTION",
    code: "FREE",
    name: "Découverte",
    description: "Pour démarrer avec un petit groupe d'étudiants.",
    priceMonthlyFcfa: null,
    priceYearlyFcfa: null,
    limits: { maxStudents: 15, maxJurys: 3, autoJuryAssignment: false },
  },
  STANDARD: {
    role: "INSTITUTION",
    code: "STANDARD",
    name: "Standard",
    description: "Pour une promotion complète, jurys illimités.",
    priceMonthlyFcfa: 15_000, // provisoire
    priceYearlyFcfa: null,
    limits: { maxStudents: 150, maxJurys: null, autoJuryAssignment: true },
  },
  ETABLISSEMENT: {
    role: "INSTITUTION",
    code: "ETABLISSEMENT",
    name: "Établissement",
    description: "Étudiants illimités, pour tout un établissement.",
    priceMonthlyFcfa: 40_000, // provisoire
    priceYearlyFcfa: null,
    limits: { maxStudents: null, maxJurys: null, autoJuryAssignment: true },
  },
};

export const ALL_PLAN_DEFINITIONS: PlanDefinition[] = [
  ...Object.values(STUDENT_PLANS),
  ...Object.values(INSTITUTION_PLANS),
];

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}
