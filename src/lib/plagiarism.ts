// src/lib/plagiarism.ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/embedding-client";
import {
  searchOpenAlex,
  searchHal,
  searchCore,
  extractKeywords,
  type ExternalCandidate,
  type ExternalPlagiarismSource,
} from "@/lib/plagiarism-external";
import { logError } from "@/lib/log-error";

const MAX_EMBEDDING_CHARACTERS = 60_000;
const EMBEDDING_CHUNK_SIZE = 800;
const FINGERPRINT_KGRAM_SIZE = 5;
const FINGERPRINT_WINDOW_SIZE = 4;

// --- Calibration du signal sémantique (anisotropie du modèle d'embeddings) ---------------
//
// Mesuré le 2026-08-20 avec le modèle actuel (Xenova/paraphrase-multilingual-MiniLM-L12-v2),
// vecteur document = moyenne + renormalisation des embeddings de chunks (même calcul que
// toWholeEmbedding/averageVectors ci-dessous), sur des paires réelles du corpus :
//
//   Paires SANS AUCUN RAPPORT (sujets différents, français/anglais mélangés) :
//     Plaquette_Cabinet_Detective <-> memoire_Anglais_kim ............... 59.8%
//     Plaquette_Cabinet_Detective <-> Controle_Interne_Fiabilite_IF_PME .. 85.8%
//     Plaquette_Cabinet_Detective <-> SecuriteDesBasesDeDonnées .......... 76.3%
//     Plaquette_Cabinet_Detective <-> Plateforme_Suivi_Ventes_Boutique ... 72.5%
//     Controle_Interne_Fiabilite_IF_PME <-> memoire_Anglais_kim .......... 66.3%
//     SecuriteDesBasesDeDonnées <-> memoire_Anglais_kim .................. 59.8%
//     -> moyenne 70.1%, MAX 85.8% (donc largement au-dessus de l'ancien seuil de 55%,
//        ce qui explique les faux positifs observés jusqu'à 86% entre textes sans rapport)
//
//   Paire PROCHE (texte académique reformulé, même contenu, vocabulaire différent) :
//     -> 91.2%
//
// Le signal utile (91.2%) et le pire cas de bruit observé (85.8%) ne sont séparés que de
// 5.4 points en valeur brute — un simple relèvement du seuil brut resterait fragile (un
// futur pair de textes sans rapport pourrait dépasser 85.8%). On normalise donc le cosinus
// par rapport à un plancher calibré plutôt que de le comparer brut à un seuil : le score
// affiché représente "de combien on dépasse le bruit de fond typique du modèle", pas la
// similarité cosinus elle-même. SEMANTIC_FLOOR est fixé légèrement au-dessus du pire cas
// mesuré (85.8%) par marge de sécurité — normalizeSemanticScore ci-dessous.
const SEMANTIC_FLOOR = 0.86;

// Empreintes Winnowing : mêmes paires sans rapport mesurées en containment -> 0% partout,
// y compris sur la paire "proche" reformulée (attendu : un synonyme change le hash du
// k-gramme, Winnowing ne capte que des suites de mots quasi identiques). Pas de plancher de
// bruit ici, contrairement au sémantique — seuil laissé inchangé.
const FINGERPRINT_MATCH_THRESHOLD_PERCENT = 20;

// Seuil appliqué au score sémantique NORMALISÉ (voir normalizeSemanticScore), plus au cosinus
// brut — ancienne valeur 55 (brute) devenue sans objet, la paire reformulée de calibration
// (91.2% brut) normalise à ~37%, marge conservée en dessous pour absorber la variance sur un
// seul point de calibration positif.
const SEMANTIC_MATCH_THRESHOLD_PERCENT = 20;

const MAX_MATCHES = 5;
const MAX_PASSAGES_PER_MATCH = 8;

// Choix assumé : la comparaison reste inter-établissements (c'est la valeur de l'outil — une
// copie provenant d'un autre établissement doit être détectable), mais l'extrait affiché du
// mémoire TIERS comparé est volontairement borné. Assez long pour juger visuellement d'une
// similarité, pas assez pour reconstituer un passage entier du travail de quelqu'un d'autre
// qui n'a jamais consenti à ce que son texte soit lu par un tiers via ce rapport. Le texte de
// l'étudiant qui consulte SON PROPRE rapport (studentExcerpt) n'est lui jamais tronqué —
// aucune préoccupation de confidentialité sur son propre contenu.
const MAX_THIRD_PARTY_EXCERPT_CHARS = 240;

function truncateThirdPartyExcerpt(text: string): string {
  if (text.length <= MAX_THIRD_PARTY_EXCERPT_CHARS) return text;
  const cut = text.slice(0, MAX_THIRD_PARTY_EXCERPT_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace > MAX_THIRD_PARTY_EXCERPT_CHARS * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut.trimEnd()}…`;
}

// Rescale le cosinus brut [SEMANTIC_FLOOR, 1] vers [0, 100] — un cosinus au niveau du bruit de
// fond calibré (ou en dessous) donne 0, un cosinus de 1 (documents identiques) donne 100.
function normalizeSemanticScore(rawCosine: number): number {
  const normalized = (rawCosine - SEMANTIC_FLOOR) / (1 - SEMANTIC_FLOOR);
  return Math.round(Math.max(0, Math.min(1, normalized)) * 100);
}

export interface PlagiarismPassage {
  score: number;
  // Signal qui a déclenché ce passage — sémantique (le sens se ressemble) ou empreintes
  // (copie quasi-exacte). Purement informatif pour l'affichage, ne change rien à la décision.
  kind: "semantic" | "exact";
  studentStart: number;
  studentEnd: number;
  studentExcerpt: string;
  matchedStart: number;
  matchedEnd: number;
  // Tronqué à MAX_THIRD_PARTY_EXCERPT_CHARS (voir truncateThirdPartyExcerpt) — matchedStart/
  // matchedEnd restent les bornes réelles du chunk comparé, mais le texte affiché ne couvre
  // pas forcément toute cette plage : exposition volontairement réduite du contenu d'un
  // mémoire tiers.
  matchedExcerpt: string;
}

// INTERNAL = comparé à un autre mémoire déjà déposé sur Thesus (comportement historique) ;
// les quatre autres viennent de plagiarism-external.ts. Optionnel côté stockage : absent
// (pas juste "INTERNAL" par défaut) sur les rapports générés avant l'ajout des sources
// externes — toujours lire via `match.source ?? "INTERNAL"` côté affichage.
export type PlagiarismSource = "INTERNAL" | ExternalPlagiarismSource;

export interface PlagiarismMatch {
  source?: PlagiarismSource;
  // Uniquement pour les matches INTERNAL (lien vers /memoires/[id]) — absent pour les sources
  // externes, qui n'ont pas d'identifiant Thesus, seulement une URL (voir url ci-dessous).
  memoireId?: string;
  // Uniquement pour les sources externes — lien vers la ressource trouvée (OpenAlex, HAL ou
  // CORE).
  url?: string;
  title: string;
  score: number;
  // Optionnel : absent (pas juste vide) sur les rapports générés avant l'ajout de cette
  // granularité — le JSON stocké pour ces anciens matches n'a tout simplement pas ce champ.
  // Toujours lire via `match.passages ?? []` côté affichage, jamais supposer sa présence.
  // Non pertinent pour les sources externes (pas de texte intégral à découper en passages,
  // seulement un titre/résumé) — toujours absent pour elles, jamais un tableau vide.
  passages?: PlagiarismPassage[];
  // Vrai quand passages est vide spécifiquement parce que LE CANDIDAT comparé n'a pas encore
  // été retraité depuis l'ajout de cette granularité (signature encore au format "vecteur à
  // plat") — distinct d'un passages vide parce que la passe détaillée a tourné et n'a
  // légitimement rien trouvé au-dessus du seuil. Sans cette distinction, les deux cas sont
  // indiscernables à l'affichage alors que le premier est actionnable (relancer l'analyse sur
  // le mémoire comparé) et pas le second. Non pertinent pour les sources externes.
  passagesUnavailable?: boolean;
}

export interface PlagiarismResult {
  similarityScore: number;
  matches: PlagiarismMatch[];
}

// Signature d'un seul chunk du document en cours d'analyse — jamais persistée telle quelle
// (voir plus bas, contentEmbedding/contentFingerprints stockent chacun leur moitié).
interface ChunkSignature {
  start: number;
  end: number;
  embedding: number[];
  fingerprints: number[];
}

interface StoredEmbeddingChunk {
  start: number;
  end: number;
  embedding: number[];
}

interface StoredFingerprintChunk {
  start: number;
  end: number;
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
// Inchangé — appliqué maintenant par chunk plutôt qu'au document entier (voir
// computeChunkSignatures), ce qui ancre chaque empreinte à la position de son chunk.
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

interface TextChunk {
  start: number;
  end: number;
  text: string;
}

// Découpe le texte en tronçons de taille fixe (même taille qu'avant l'ajout de cette
// granularité — la façon dont chaque chunk est embedé/empreint ne change pas, seule sa
// position d'origine est maintenant conservée). Les positions retournées pointent sur le
// texte déjà trimé, pour que extractedText.slice(start, end) redonne exactement le même
// extrait sans espace superflu en bord de chunk.
function splitIntoChunks(text: string, size: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  for (let offset = 0; offset < text.length; offset += size) {
    const raw = text.slice(offset, offset + size);
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const start = offset + (raw.length - raw.trimStart().length);
    chunks.push({ start, end: start + trimmed.length, text: trimmed });
  }
  return chunks;
}

async function computeChunkSignatures(text: string): Promise<ChunkSignature[]> {
  const chunks = splitIntoChunks(text.slice(0, MAX_EMBEDDING_CHARACTERS), EMBEDDING_CHUNK_SIZE);
  return Promise.all(
    chunks.map(async (chunk) => ({
      start: chunk.start,
      end: chunk.end,
      embedding: await embedText(chunk.text),
      fingerprints: computeFingerprints(chunk.text),
    })),
  );
}

// Moyenne + normalisation identiques à l'ancienne computeEmbedding (qui moyennait en interne
// pendant le chunking) — reproduite ici pour pouvoir dériver le vecteur document à la volée
// à partir de chunks déjà calculés, sans le stocker séparément.
function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dimensions = vectors[0].length;
  const averaged = new Array<number>(dimensions).fill(0);
  for (const vector of vectors) {
    for (let i = 0; i < dimensions; i++) averaged[i] += vector[i];
  }
  for (let i = 0; i < dimensions; i++) averaged[i] /= vectors.length;

  const norm = Math.sqrt(averaged.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? averaged.map((value) => value / norm) : averaged;
}

function unionFingerprints(chunks: Array<{ fingerprints: number[] }>): number[] {
  const set = new Set<number>();
  for (const chunk of chunks) for (const fp of chunk.fingerprints) set.add(fp);
  return [...set];
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

// Les signatures stockées avant cette granularité sont un vecteur/tableau de hashs "à plat"
// (Memoire.contentEmbedding: number[], .contentFingerprints: number[]) — la nouvelle forme
// est un tableau d'objets {start, end, ...}. Les deux sont des JSON arrays, donc on ne peut
// distinguer qu'au runtime, sur le type du premier élément.
function isLegacyFlatArray(value: unknown): value is number[] {
  return Array.isArray(value) && (value.length === 0 || typeof value[0] === "number");
}

function toEmbeddingChunks(value: unknown): StoredEmbeddingChunk[] {
  return isLegacyFlatArray(value) ? [] : (value as StoredEmbeddingChunk[]);
}

function toFingerprintChunks(value: unknown): StoredFingerprintChunk[] {
  return isLegacyFlatArray(value) ? [] : (value as StoredFingerprintChunk[]);
}

// Vecteur document — soit directement l'ancien format (déjà un vecteur unique), soit dérivé
// à la volée des chunks du nouveau format. Le score document-à-document (passe 1, ci-dessous)
// fonctionne donc identiquement quel que soit le format du candidat.
function toWholeEmbedding(value: unknown, chunks: StoredEmbeddingChunk[]): number[] {
  return isLegacyFlatArray(value) ? value : averageVectors(chunks.map((chunk) => chunk.embedding));
}

function toWholeFingerprints(value: unknown, chunks: StoredFingerprintChunk[]): number[] {
  return isLegacyFlatArray(value) ? value : unionFingerprints(chunks);
}

// Passe 2 (détaillée) : uniquement appelée pour les candidats déjà retenus par la passe 1.
// Compare chaque chunk de l'étudiant à chaque chunk du candidat — mêmes seuils, même formule
// de score que la comparaison document-à-document, juste appliqués à une paire de chunks.
function findSimilarPassages(
  studentChunks: ChunkSignature[],
  studentText: string,
  candidateEmbeddingChunks: StoredEmbeddingChunk[],
  candidateFingerprintChunks: StoredFingerprintChunk[],
  candidateText: string,
): PlagiarismPassage[] {
  const candidateChunks = candidateEmbeddingChunks.map((chunk, index) => ({
    start: chunk.start,
    end: chunk.end,
    embedding: chunk.embedding,
    fingerprints: candidateFingerprintChunks[index]?.fingerprints ?? [],
  }));

  const passages: PlagiarismPassage[] = [];
  for (const s of studentChunks) {
    for (const c of candidateChunks) {
      const semanticScore = normalizeSemanticScore(cosineSimilarity(s.embedding, c.embedding));
      const exactScore = Math.round(fingerprintContainment(s.fingerprints, c.fingerprints) * 100);

      const isPassageSignificant =
        semanticScore >= SEMANTIC_MATCH_THRESHOLD_PERCENT || exactScore >= FINGERPRINT_MATCH_THRESHOLD_PERCENT;
      if (!isPassageSignificant) continue;

      passages.push({
        score: Math.max(semanticScore, exactScore),
        kind: exactScore >= semanticScore ? "exact" : "semantic",
        studentStart: s.start,
        studentEnd: s.end,
        studentExcerpt: studentText.slice(s.start, s.end),
        matchedStart: c.start,
        matchedEnd: c.end,
        matchedExcerpt: truncateThirdPartyExcerpt(candidateText.slice(c.start, c.end)),
      });
    }
  }

  passages.sort((a, b) => b.score - a.score);

  // Un même passage copié ressort souvent sur plusieurs paires de chunks adjacents (chevauchement
  // du découpage) — ne garder que le passage le plus significatif par zone du texte de
  // l'étudiant, plutôt que d'afficher des quasi-doublons.
  const seenRanges: Array<[number, number]> = [];
  const deduped: PlagiarismPassage[] = [];
  for (const passage of passages) {
    const overlaps = seenRanges.some(([start, end]) => passage.studentStart < end && passage.studentEnd > start);
    if (overlaps) continue;
    seenRanges.push([passage.studentStart, passage.studentEnd]);
    deduped.push(passage);
    if (deduped.length >= MAX_PASSAGES_PER_MATCH) break;
  }

  return deduped;
}

const MAX_EXTERNAL_ACADEMIC_MATCHES = 5;
const ACADEMIC_QUERY_KEYWORD_COUNT = 8;

// --- Calibration du score des sources académiques externes ------------------------------
//
// Mesuré le 2026-08-20 : comparer l'embedding d'un titre+résumé (quelques centaines de
// caractères) à l'embedding du DOCUMENT ENTIER de l'étudiant (moyenné sur ~20 chunks pour un
// mémoire typique) ne sépare pas signal et bruit — contrairement à la comparaison
// document-à-document interne, ici la différence de longueur/genre entre les deux textes
// domine le signal :
//
//   Résultats OpenAlex topiquement liés au sujet du mémoire (freelance/confiance) :
//     46.6%, 53.5%, 55.8% de cosinus brut
//   Résultats OpenAlex SANS AUCUN RAPPORT (sujet sécurité/bases de données) :
//     43.9%, 51.2%, 62.0% de cosinus brut
//
// Aucune séparation exploitable (les deux groupes se chevauchent). Le sémantique par
// embedding reste utilisé pour la comparaison interne (documents de longueur/genre
// comparables, correctement calibré, voir SEMANTIC_FLOOR) mais PAS ici — comme le permettait
// explicitement la demande d'origine ("une comparaison plus simple si le contenu récupéré
// est trop court"). À la place : chevauchement des mots-clés de la requête (extraits du
// contenu de l'étudiant) dans le titre+résumé du résultat — mesuré sur le même échantillon :
//   Résultats liés : 25%, 25%, 50% de mots-clés en commun
//   Résultats sans rapport : 0%, 0%, 13%
// Séparation nette. Seuil fixé à 20% (au-dessus du pire bruit mesuré à 13%, sous le plus
// faible résultat lié mesuré à 25%).
const ACADEMIC_OVERLAP_THRESHOLD_PERCENT = 20;

// Interroge OpenAlex/HAL/CORE par mots-clés — les trois sources en parallèle via allSettled,
// aucune ne pouvant faire échouer les autres ni l'analyse anti-plagiat dans son ensemble.
// Toujours appelée depuis un try/catch supplémentaire côté appelant (runPlagiarismCheck) par
// prudence.
//
// La requête est bâtie à partir de mots-clés extraits du contenu (extractKeywords), pas de
// Memoire.title : en pratique ce champ est un nom de fichier (ex.
// "Memoire_Controle_Interne_PME"), pas un vrai titre académique — vérifié empiriquement lors
// de l'itération qui a introduit ce module, un nom de fichier ou une phrase complète en
// requête ne renvoyaient que du bruit sans rapport, alors que des mots-clés fréquents du
// contenu ciblent correctement le sujet réel.
async function computeExternalMatches(extractedText: string): Promise<PlagiarismMatch[]> {
  const keywords = extractKeywords(extractedText, ACADEMIC_QUERY_KEYWORD_COUNT);
  if (keywords.length === 0) return [];
  const academicQuery = keywords.join(" ");

  const [openAlexResult, halResult, coreResult] = await Promise.allSettled([
    searchOpenAlex(academicQuery),
    searchHal(academicQuery),
    searchCore(academicQuery),
  ]);

  const academicCandidates: ExternalCandidate[] = [
    ...(openAlexResult.status === "fulfilled" ? openAlexResult.value : []),
    ...(halResult.status === "fulfilled" ? halResult.value : []),
    ...(coreResult.status === "fulfilled" ? coreResult.value : []),
  ];

  // Recherche par mots-clés (sujet), donc un résultat retourné n'est pas forcément proche en
  // contenu. Score = proportion des mots-clés de la requête retrouvés dans le titre+résumé du
  // résultat — pas un embedding (voir ACADEMIC_OVERLAP_THRESHOLD_PERCENT ci-dessus pour la
  // mesure qui justifie ce choix).
  const academicMatches: PlagiarismMatch[] = [];
  for (const candidate of academicCandidates) {
    const text = candidate.text.trim();
    if (!text) continue;

    const lowerText = text.toLowerCase();
    const overlapping = keywords.filter((keyword) => lowerText.includes(keyword));
    const score = Math.round((overlapping.length / keywords.length) * 100);

    if (score >= ACADEMIC_OVERLAP_THRESHOLD_PERCENT) {
      academicMatches.push({ source: candidate.source, title: candidate.title, url: candidate.url, score });
    }
  }
  academicMatches.sort((a, b) => b.score - a.score);

  return academicMatches.slice(0, MAX_EXTERNAL_ACADEMIC_MATCHES);
}

export async function runPlagiarismCheck(
  memoireId: string,
  extractedText: string,
): Promise<PlagiarismResult> {
  const studentChunks = await computeChunkSignatures(extractedText);
  const studentWholeEmbedding = averageVectors(studentChunks.map((chunk) => chunk.embedding));
  const studentWholeFingerprints = unionFingerprints(studentChunks);

  const candidates = await prisma.memoire.findMany({
    where: {
      id: { not: memoireId },
      contentEmbedding: { not: Prisma.DbNull },
      contentFingerprints: { not: Prisma.DbNull },
    },
    select: {
      id: true,
      title: true,
      extractedText: true,
      contentEmbedding: true,
      contentFingerprints: true,
    },
  });

  const matches: PlagiarismMatch[] = [];
  for (const candidate of candidates) {
    const candidateEmbeddingChunks = toEmbeddingChunks(candidate.contentEmbedding);
    const candidateFingerprintChunks = toFingerprintChunks(candidate.contentFingerprints);
    const candidateWholeEmbedding = toWholeEmbedding(candidate.contentEmbedding, candidateEmbeddingChunks);
    const candidateWholeFingerprints = toWholeFingerprints(candidate.contentFingerprints, candidateFingerprintChunks);

    // Passe 1 (rapide, document-à-document) : décide seule si ce candidat est retenu.
    // Score sémantique normalisé par rapport au plancher de bruit calibré (voir
    // SEMANTIC_FLOOR/normalizeSemanticScore) ; empreintes inchangées.
    const semanticScore = normalizeSemanticScore(cosineSimilarity(studentWholeEmbedding, candidateWholeEmbedding));
    const exactCopyScore = Math.round(
      fingerprintContainment(studentWholeFingerprints, candidateWholeFingerprints) * 100,
    );
    const isSignificant =
      semanticScore >= SEMANTIC_MATCH_THRESHOLD_PERCENT || exactCopyScore >= FINGERPRINT_MATCH_THRESHOLD_PERCENT;
    if (!isSignificant) continue;

    // Passe 2 (détaillée) seulement pour ce candidat retenu — jamais l'exhaustif chunk × chunk
    // entre tous les mémoires de la plateforme. Impossible si le candidat n'a pas encore été
    // retraité depuis l'ajout de cette granularité (ancien format à plat, sans chunks) : le
    // match reste valide (score global conservé), simplement sans détail de passages — signalé
    // via passagesUnavailable pour que l'affichage sache pourquoi, plutôt qu'un vide muet.
    const candidateIsLegacy = candidateEmbeddingChunks.length === 0 || !candidate.extractedText;

    matches.push({
      source: "INTERNAL",
      memoireId: candidate.id,
      title: candidate.title,
      score: Math.max(semanticScore, exactCopyScore),
      passages:
        !candidateIsLegacy && candidate.extractedText
          ? findSimilarPassages(
              studentChunks,
              extractedText,
              candidateEmbeddingChunks,
              candidateFingerprintChunks,
              candidate.extractedText,
            )
          : [],
      passagesUnavailable: candidateIsLegacy,
    });
  }

  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, MAX_MATCHES);

  // Sources externes — jamais bloquant pour le reste de l'analyse (déjà chaque fonction en
  // interne, mais on protège aussi l'appel groupé) ; capées séparément du corpus interne pour
  // qu'aucun des deux axes ne fasse disparaître l'autre du rapport.
  let externalMatches: PlagiarismMatch[] = [];
  try {
    externalMatches = await computeExternalMatches(extractedText);
  } catch (error) {
    logError("plagiarism:computeExternalMatches", error, { memoireId });
  }

  const allMatches = [...topMatches, ...externalMatches];
  const similarityScore = allMatches.length > 0 ? Math.max(...allMatches.map((m) => m.score)) : 0;

  await prisma.memoire.update({
    where: { id: memoireId },
    data: {
      contentEmbedding: studentChunks.map(({ start, end, embedding }) => ({
        start,
        end,
        embedding,
      })) as unknown as Prisma.InputJsonValue,
      contentFingerprints: studentChunks.map(({ start, end, fingerprints }) => ({
        start,
        end,
        fingerprints,
      })) as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.plagiarismReport.upsert({
    where: { memoireId },
    create: {
      memoireId,
      similarityScore,
      matches: allMatches as unknown as Prisma.InputJsonValue,
    },
    update: {
      similarityScore,
      matches: allMatches as unknown as Prisma.InputJsonValue,
    },
  });

  return { similarityScore, matches: allMatches };
}
