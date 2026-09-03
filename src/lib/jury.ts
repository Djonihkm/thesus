// src/lib/jury.ts
import { Type, type Schema } from "@google/genai";
import { generateAiContent, getAiModel } from "@/lib/ai-client";

const MAX_INPUT_CHARACTERS = 120_000;
const JURY_CATEGORIES = [
  "METHODOLOGIE",
  "RESULTATS",
  "REVUE_LITTERATURE",
  "PROBLEMATIQUE",
  "PERSPECTIVES",
] as const;

export type GeneratedJuryCategory = (typeof JURY_CATEGORIES)[number];

export interface GeneratedJuryQuestion {
  category: GeneratedJuryCategory;
  question: string;
  order: number;
}

const JURY_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description:
        "Environ 2 questions par catégorie (10 au total), des questions qu'un jury de soutenance " +
        "poserait réellement sur ce mémoire précis.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            format: "enum",
            enum: [...JURY_CATEGORIES],
            description:
              "METHODOLOGIE, RESULTATS, REVUE_LITTERATURE (état de l'art), PROBLEMATIQUE, PERSPECTIVES.",
          },
          question: { type: Type.STRING },
          order: { type: Type.INTEGER },
        },
        required: ["category", "question", "order"],
      },
    },
  },
  required: ["questions"],
};

export async function generateJurySimulation(
  extractedText: string,
): Promise<GeneratedJuryQuestion[]> {
  const text = extractedText.slice(0, MAX_INPUT_CHARACTERS);

  const response = await generateAiContent({
    model: getAiModel(),
    contents: `Voici le contenu extrait du mémoire pour lequel préparer les questions de soutenance :\n\n${text}`,
    config: {
      systemInstruction:
        "Tu es un membre de jury académique expérimenté qui prépare des questions de soutenance " +
        "pour un étudiant, à partir du contenu réel de son mémoire (méthodologie employée, résultats " +
        "présentés, littérature citée ou manquante, problématique posée, limites et perspectives). " +
        "Les questions doivent être précises et spécifiques à ce mémoire, pas génériques. Rédige tout " +
        "en français.",
      responseMimeType: "application/json",
      responseSchema: JURY_RESPONSE_SCHEMA,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Le modèle n'a pas retourné de questions de jury structurées.");
  }

  try {
    const parsed = JSON.parse(responseText) as { questions: GeneratedJuryQuestion[] };
    return parsed.questions;
  } catch {
    // Ne jamais laisser une erreur de parsing JSON brute (illisible) remonter jusqu'à
    // l'étudiant — le schéma imposé au modèle rend ce cas rare mais pas impossible.
    throw new Error("Les questions générées étaient mal formées. Réessayez dans un instant.");
  }
}
