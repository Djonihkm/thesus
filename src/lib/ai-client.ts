// src/lib/ai-client.ts
// Point d'entrée unique vers le fournisseur IA (Gemini) — centralise le choix du client
// et du modèle pour que les futurs modules (quiz, simulation de jury) suivent le même pattern.
import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.6-flash";

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
