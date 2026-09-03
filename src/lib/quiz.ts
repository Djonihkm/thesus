// src/lib/quiz.ts
import { Type, type Schema } from "@google/genai";
import { generateAiContent, getAiModel } from "@/lib/ai-client";

const MAX_INPUT_CHARACTERS = 120_000;
const QUESTION_TYPES = ["QCU", "VRAI_FAUX", "TEXTE_TROU"] as const;

export type GeneratedQuestionType = (typeof QUESTION_TYPES)[number];

export interface GeneratedQuizQuestion {
  type: GeneratedQuestionType;
  question: string;
  choices: string[] | null;
  correctAnswer: string;
  order: number;
}

// Par défaut (plans avec quiz illimité) : une fourchette raisonnable plutôt qu'un nombre
// fixe, pour laisser le modèle s'adapter à la longueur du mémoire.
const DEFAULT_QUESTION_RANGE = "Entre 10 et 12 questions";

function buildQuizResponseSchema(maxQuestions: number | null): Schema {
  const countDescription =
    maxQuestions === null ? DEFAULT_QUESTION_RANGE : `Exactement ${maxQuestions} questions`;

  return {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        description: `${countDescription} mélangeant les 3 types, dans l'ordre où elles doivent être posées.`,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              format: "enum",
              enum: [...QUESTION_TYPES],
              description:
                "QCU = question à choix unique, VRAI_FAUX = affirmation vrai/faux, TEXTE_TROU = texte à trou (réponse courte).",
            },
            question: {
              type: Type.STRING,
              description:
                "Pour TEXTE_TROU, la question doit contenir un blanc représenté par '____'.",
            },
            choices: {
              type: Type.ARRAY,
              description:
                "Options de réponse. Obligatoire pour QCU (3 à 5 options) et VRAI_FAUX (toujours exactement [\"Vrai\", \"Faux\"]). Laisser un tableau vide pour TEXTE_TROU.",
              items: { type: Type.STRING },
            },
            correctAnswer: {
              type: Type.STRING,
              description:
                "La réponse correcte : doit correspondre exactement à une valeur de 'choices' pour QCU/VRAI_FAUX, ou au mot/groupe de mots attendu pour TEXTE_TROU.",
            },
            order: { type: Type.INTEGER },
          },
          required: ["type", "question", "choices", "correctAnswer", "order"],
        },
      },
    },
    required: ["questions"],
  };
}

// maxQuestions vient de StudentPlanLimits.quizMaxQuestions (voir pricing-config.ts) — null
// pour les plans à quiz illimité, laisse alors le modèle choisir dans DEFAULT_QUESTION_RANGE.
export async function generateQuiz(
  extractedText: string,
  maxQuestions: number | null = null,
): Promise<GeneratedQuizQuestion[]> {
  const text = extractedText.slice(0, MAX_INPUT_CHARACTERS);

  const response = await generateAiContent({
    model: getAiModel(),
    contents: `Voici le contenu extrait du mémoire à partir duquel générer le quiz :\n\n${text}`,
    config: {
      systemInstruction:
        "Tu es un enseignant qui prépare un quiz d'auto-évaluation pour un étudiant à partir de son " +
        "propre mémoire universitaire. Génère des questions qui portent sur le contenu réel du texte " +
        "fourni (concepts, méthodologie, résultats, définitions), pas des questions génériques. " +
        "Mélange les 3 types de questions demandés. Rédige tout en français.",
      responseMimeType: "application/json",
      responseSchema: buildQuizResponseSchema(maxQuestions),
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Le modèle n'a pas retourné de quiz structuré.");
  }

  let parsed: { questions: GeneratedQuizQuestion[] };
  try {
    parsed = JSON.parse(responseText) as { questions: GeneratedQuizQuestion[] };
  } catch {
    // Ne jamais laisser une erreur de parsing JSON brute (illisible) remonter jusqu'à
    // l'étudiant — le schéma imposé au modèle rend ce cas rare mais pas impossible.
    throw new Error("Le quiz généré était mal formé. Réessayez dans un instant.");
  }
  return parsed.questions.map((question) => ({
    ...question,
    choices: question.choices && question.choices.length > 0 ? question.choices : null,
  }));
}
