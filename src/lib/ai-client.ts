// src/lib/ai-client.ts
// Point d'entrée unique vers le fournisseur IA (Gemini) — centralise le choix du client
// et du modèle pour que les futurs modules (quiz, simulation de jury) suivent le même pattern.
import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { logError } from "@/lib/log-error";

const DEFAULT_MODEL = "gemini-3.6-flash";

// Résilience de generateAiContent ci-dessous : un timeout sans quoi une requête Gemini peut
// rester en attente indéfiniment (aucun timeout par défaut côté SDK), et un retry borné avec
// backoff sur les erreurs transitoires (quota 429, 5xx, coupure réseau) — audit, quiz, jury et
// chat partageaient jusqu'ici un seul appel generateContent sans aucune des deux.
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_000;

let client: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export function getAiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

// Erreur finale et déjà traduite renvoyée par generateAiContent — les appelants (quiz.ts,
// jury.ts, audit.ts, ai-chat.ts) peuvent afficher error.message directement à l'utilisateur
// sans jamais lui exposer une erreur technique brute du SDK Gemini.
export class AiGenerationError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (typeof status === "number") {
    return status === 429 || status >= 500;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /\b(429|5\d{2})\b|rate.?limit|quota|timeout|timed out|ECONNRESET|ETIMEDOUT|fetch failed/i.test(
    message,
  );
}

// Remplace tout appel direct à getAiClient().models.generateContent — voir les constantes
// ci-dessus pour le timeout/retry appliqués. Après MAX_ATTEMPTS échecs (ou une erreur jugée
// non transitoire, ex. clé API invalide), lève une AiGenerationError avec un message en
// français prêt à être affiché tel quel.
export async function generateAiContent(
  params: GenerateContentParameters,
): Promise<GenerateContentResponse> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await getAiClient().models.generateContent({
        ...params,
        config: { ...params.config, httpOptions: { timeout: REQUEST_TIMEOUT_MS } },
      });
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS || !isRetryableError(error)) break;
      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  logError("ai-client:generateAiContent", lastError);
  throw new AiGenerationError(
    "Le service d'intelligence artificielle est momentanément surchargé ou indisponible. Réessayez dans un instant.",
  );
}
