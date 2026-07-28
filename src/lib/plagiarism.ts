// src/lib/plagiarism.ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/embedding-client";

const MAX_EMBEDDING_CHARACTERS = 60_000;
const EMBEDDING_CHUNK_SIZE = 800;
const FINGERPRINT_KGRAM_SIZE = 5;
const FINGERPRINT_WINDOW_SIZE = 4;
// Deux seuils distincts : la similarité sémantique seule a une base de bruit élevée entre
// deux textes académiques français sans rapport (même registre, même vocabulaire formel),
// donc son seuil doit être nettement plus haut que celui du fingerprinting, qui lui ne
// capte que des copies textuelles exactes (même partielles) et reste fiable à un seuil bas.
const SEMANTIC_MATCH_THRESHOLD_PERCENT = 55;
const FINGERPRINT_MATCH_THRESHOLD_PERCENT = 20;
const MAX_MATCHES = 5;

export interface PlagiarismMatch {
  memoireId: string;
  title: string;
  score: number;
}

export interface PlagiarismResult {
  similarityScore: number;
  matches: PlagiarismMatch[];
}

interface ContentSignature {
  embedding: number[];
  fingerprints: number[];
}

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Algorithme de Winnowing (Schleimer et al.) : réduit le texte à un petit ensemble
// d'empreintes robustes, en gardant le minimum de chaque fenêtre de hashs de k-grammes.
// Permet de détecter des copies exactes (même partielles) sans comparer les textes en entier.
function computeFingerprints(text: string): number[] {
  const words = normalizeText(text).split(" ").filter(Boolean);
  if (words.length < FINGERPRINT_KGRAM_SIZE) return [];

  const hashes: number[] = [];
  for (let i = 0; i + FINGERPRINT_KGRAM_SIZE <= words.length; i++) {
    hashes.push(hashString(words.slice(i, i + FINGERPRINT_KGRAM_SIZE).join(" ")));
  }

  if (hashes.length <= FINGERPRINT_WINDOW_SIZE) {
    return [...new Set(hashes)];
  }

  const fingerprints = new Set<number>();
  let previousMinPos = -1;
  for (let i = 0; i + FINGERPRINT_WINDOW_SIZE <= hashes.length; i++) {
    let minPos = i;
    for (let j = i + 1; j < i + FINGERPRINT_WINDOW_SIZE; j++) {
      if (hashes[j] <= hashes[minPos]) minPos = j;
    }
    if (minPos !== previousMinPos) {
      fingerprints.add(hashes[minPos]);
      previousMinPos = minPos;
    }
  }
  return [...fingerprints];
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    const chunk = text.slice(i, i + size).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

async function computeEmbedding(text: string): Promise<number[]> {
  const chunks = chunkText(text.slice(0, MAX_EMBEDDING_CHARACTERS), EMBEDDING_CHUNK_SIZE);
  if (chunks.length === 0) return [];

  const chunkEmbeddings = await Promise.all(chunks.map((chunk) => embedText(chunk)));
  const dimensions = chunkEmbeddings[0].length;
  const averaged = new Array<number>(dimensions).fill(0);

  for (const embedding of chunkEmbeddings) {
    for (let i = 0; i < dimensions; i++) averaged[i] += embedding[i];
  }
  for (let i = 0; i < dimensions; i++) averaged[i] /= chunkEmbeddings.length;

  const norm = Math.sqrt(averaged.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? averaged.map((value) => value / norm) : averaged;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) dotProduct += a[i] * b[i];
  return Math.max(0, Math.min(1, dotProduct));
}

// Containment plutôt que Jaccard : un court passage copié dans un mémoire beaucoup plus
// long doit quand même ressortir avec un score élevé.
function fingerprintContainment(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const intersection = a.filter((hash) => setB.has(hash)).length;
  return intersection / Math.min(a.length, b.length);
}

async function computeSignature(extractedText: string): Promise<ContentSignature> {
  const [embedding, fingerprints] = await Promise.all([
    computeEmbedding(extractedText),
    Promise.resolve(computeFingerprints(extractedText)),
  ]);
  return { embedding, fingerprints };
}

export async function runPlagiarismCheck(
  memoireId: string,
  extractedText: string,
): Promise<PlagiarismResult> {
  const signature = await computeSignature(extractedText);

  const candidates = await prisma.memoire.findMany({
    where: {
      id: { not: memoireId },
      contentEmbedding: { not: Prisma.DbNull },
      contentFingerprints: { not: Prisma.DbNull },
    },
    select: { id: true, title: true, contentEmbedding: true, contentFingerprints: true },
  });

  const matches: PlagiarismMatch[] = [];
  for (const candidate of candidates) {
    const candidateEmbedding = candidate.contentEmbedding as unknown as number[];
    const candidateFingerprints = candidate.contentFingerprints as unknown as number[];

    const semanticScore = Math.round(cosineSimilarity(signature.embedding, candidateEmbedding) * 100);
    const exactCopyScore = Math.round(
      fingerprintContainment(signature.fingerprints, candidateFingerprints) * 100,
    );

    const isSignificant =
      semanticScore >= SEMANTIC_MATCH_THRESHOLD_PERCENT ||
      exactCopyScore >= FINGERPRINT_MATCH_THRESHOLD_PERCENT;

    if (isSignificant) {
      matches.push({
        memoireId: candidate.id,
        title: candidate.title,
        score: Math.max(semanticScore, exactCopyScore),
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, MAX_MATCHES);
  const similarityScore = topMatches.length > 0 ? topMatches[0].score : 0;

  await prisma.memoire.update({
    where: { id: memoireId },
    data: {
      contentEmbedding: signature.embedding as unknown as Prisma.InputJsonValue,
      contentFingerprints: signature.fingerprints as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.plagiarismReport.upsert({
    where: { memoireId },
    create: {
      memoireId,
      similarityScore,
      matches: topMatches as unknown as Prisma.InputJsonValue,
    },
    update: {
      similarityScore,
      matches: topMatches as unknown as Prisma.InputJsonValue,
    },
  });

  return { similarityScore, matches: topMatches };
}
