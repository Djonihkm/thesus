// src/lib/audit.ts
import { Type, type Schema } from "@google/genai";
import { getAiClient, getAiModel } from "@/lib/ai-client";

const MAX_INPUT_CHARACTERS = 120_000;

export type AuditRecommendationCategory =
  | "structure"
  | "coherence"
  | "writing_quality"
  | "general";

export interface AuditRecommendation {
  category: AuditRecommendationCategory;
  message: string;
}

export interface AuditResult {
  score: number;
  structureScore: number;
  coherenceScore: number;
  writingQualityScore: number;
  recommendations: AuditRecommendation[];
}

const AUDIT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "Note globale du mémoire, sur 20.",
    },
    structureScore: {
      type: Type.NUMBER,
      description:
        "Note de la structure du mémoire (plan, organisation des parties, équilibre), sur 20.",
    },
    coherenceScore: {
      type: Type.NUMBER,
      description: "Note de la cohérence du raisonnement et des enchaînements d'idées, sur 20.",
    },
    writingQualityScore: {
      type: Type.NUMBER,
      description: "Note de la qualité rédactionnelle (style, orthographe, clarté), sur 20.",
    },
    recommendations: {
      type: Type.ARRAY,
      description: "Recommandations concrètes et actionnables pour améliorer le mémoire.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            format: "enum",
            enum: ["structure", "coherence", "writing_quality", "general"],
          },
          message: { type: Type.STRING },
        },
        required: ["category", "message"],
      },
    },
  },
  required: [
    "score",
    "structureScore",
    "coherenceScore",
    "writingQualityScore",
    "recommendations",
  ],
};

export async function generateAuditReport(extractedText: string): Promise<AuditResult> {
  const client = getAiClient();
  const text = extractedText.slice(0, MAX_INPUT_CHARACTERS);

  const response = await client.models.generateContent({
    model: getAiModel(),
    contents: `Voici le contenu extrait du mémoire à auditer :\n\n${text}`,
    config: {
      systemInstruction:
        "Tu es un auditeur académique expérimenté qui évalue des mémoires universitaires " +
        "(licence, master ou doctorat). Évalue objectivement la structure, la cohérence du " +
        "raisonnement et la qualité rédactionnelle du texte fourni, puis soumets ton évaluation " +
        "au format demandé. Toutes les notes sont sur 20. Les recommandations doivent être " +
        "concrètes, actionnables et rédigées en français.",
      responseMimeType: "application/json",
      responseSchema: AUDIT_RESPONSE_SCHEMA,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Le modèle n'a pas retourné de rapport d'audit structuré.");
  }

  return JSON.parse(responseText) as AuditResult;
}
