// src/lib/plagiarism-external.ts
//
// Recherche de similarité contre des sources externes gratuites, en complément de la
// comparaison interne (plagiarism.ts) : OpenAlex et HAL (APIs publiques, aucune clé requise),
// CORE (nécessite une clé — désactivée silencieusement tant qu'elle n'est pas fournie, avec
// un avertissement console une seule fois). Chaque source échoue indépendamment des autres
// (try/catch propre à chaque fonction) et jamais l'analyse anti-plagiat dans son ensemble —
// même logique de non-blocage que le reste du module.
//
// Google Custom Search a été retiré (janvier 2026 : Google a supprimé la recherche sur
// l'ensemble du web pour les nouveaux moteurs Programmable Search Engine, plus d'accès
// gratuit à l'index complet) et BASE remplacé par CORE (délai d'obtention de clé BASE trop
// long, jamais activée) — voir l'historique git pour l'implémentation retirée si besoin.

export type ExternalPlagiarismSource = "OPENALEX" | "HAL" | "CORE";

export interface ExternalCandidate {
  source: ExternalPlagiarismSource;
  title: string;
  url: string;
  // Titre + résumé/extrait disponible — jamais le texte intégral, ces APIs ne le fournissent
  // pas.
  text: string;
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_RESULTS_PER_SOURCE = 3;

// Mots vides FR/EN les plus fréquents dans un mémoire académique (y compris son gabarit —
// "université", "république", "supervision"…) — filtrés pour que les mots-clés extraits
// reflètent le SUJET plutôt que le vocabulaire générique de toute page de garde.
const STOPWORDS = new Set([
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "à", "au", "aux", "est",
  "pour", "dans", "sur", "par", "que", "qui", "ce", "cette", "ces", "son", "sa", "ses",
  "avec", "plus", "ou", "se", "ne", "pas", "il", "elle", "nous", "vous", "ils", "elles",
  "être", "avoir", "fait", "faire", "comme", "sans", "entre", "leur", "leurs", "été",
  "étude", "travail", "présent", "mémoire", "université", "république", "chapitre",
  "the", "a", "an", "and", "of", "to", "in", "for", "on", "with", "is", "are", "was",
  "were", "be", "by", "this", "that", "these", "those", "as", "at", "from", "or", "it",
  "its", "their", "study", "work", "thesis", "chapter", "under", "supervision", "presented",
]);

// Mots-clés les plus fréquents du document (hors mots vides), utilisés comme requête pour
// les sources académiques (OpenAlex/HAL/CORE) — Memoire.title est en pratique un nom de
// fichier (ex. "Memoire_Controle_Interne_PME"), pas un vrai titre académique exploitable en
// recherche : bien moins fiable que des mots-clés extraits du contenu lui-même (vérifié
// empiriquement — voir le récapitulatif de l'itération qui a introduit ce module).
export function extractKeywords(text: string, maxWords: number): string[] {
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 5 && !STOPWORDS.has(word));

  const frequency = new Map<string, number>();
  for (const word of words) frequency.set(word, (frequency.get(word) ?? 0) + 1);

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([word]) => word);
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// --- OpenAlex ------------------------------------------------------------------------------
// API publique, sans clé. https://docs.openalex.org/ — "polite pool" via mailto (facultatif,
// juste plus prioritaire en cas de charge, pas requis pour fonctionner).

interface OpenAlexWork {
  id: string;
  title: string | null;
  abstract_inverted_index?: Record<string, number[]>;
}

// abstract_inverted_index est {mot: [positions]} plutôt qu'un texte brut (format OpenAlex,
// probablement pour des raisons de droits sur le texte intégral des résumés) — à reconstruire.
function reconstructAbstract(invertedIndex: Record<string, number[]> | undefined): string {
  if (!invertedIndex) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) words[position] = word;
  }
  return words.filter(Boolean).join(" ");
}

export async function searchOpenAlex(query: string): Promise<ExternalCandidate[]> {
  try {
    const mailto = process.env.OPENALEX_MAILTO || "contact@thesus.app";
    const url =
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}` +
      `&per_page=${MAX_RESULTS_PER_SOURCE}&mailto=${encodeURIComponent(mailto)}` +
      `&select=id,title,abstract_inverted_index`;

    const data = (await fetchJson(url)) as { results?: OpenAlexWork[] };

    return (data.results ?? [])
      .filter((work): work is OpenAlexWork & { title: string } => Boolean(work.title))
      .map((work) => ({
        source: "OPENALEX" as const,
        title: work.title,
        url: work.id,
        text: [work.title, reconstructAbstract(work.abstract_inverted_index)].filter(Boolean).join(". "),
      }));
  } catch (error) {
    console.error("Recherche OpenAlex échouée :", error);
    return [];
  }
}

// --- HAL (archives ouvertes françaises) -----------------------------------------------------
// API publique, sans clé. https://api.archives-ouvertes.fr/docs

interface HalDoc {
  title_s?: string[];
  abstract_s?: string[];
  uri_s?: string;
}

export async function searchHal(query: string): Promise<ExternalCandidate[]> {
  try {
    // text:(mot1 mot2 …) — recherche Solr par termes (OR implicite), pas text:"phrase exacte"
    // : la requête est une liste de mots-clés extraits du contenu (voir extractKeywords), pas
    // une citation exacte à retrouver telle quelle.
    const url =
      `https://api.archives-ouvertes.fr/search/?q=${encodeURIComponent(`text:(${query})`)}` +
      `&rows=${MAX_RESULTS_PER_SOURCE}&fl=title_s,abstract_s,uri_s`;

    const data = (await fetchJson(url)) as { response?: { docs?: HalDoc[] } };

    return (data.response?.docs ?? [])
      .filter((doc): doc is HalDoc & { title_s: string[]; uri_s: string } => Boolean(doc.title_s?.[0] && doc.uri_s))
      .map((doc) => ({
        source: "HAL" as const,
        title: doc.title_s[0],
        url: doc.uri_s,
        text: [doc.title_s[0], doc.abstract_s?.[0]].filter(Boolean).join(". "),
      }));
  } catch (error) {
    console.error("Recherche HAL échouée :", error);
    return [];
  }
}

// --- CORE (core.ac.uk) -----------------------------------------------------------------------
// Agrégateur académique multidisciplinaire en libre accès. Nécessite une clé gratuite —
// core.ac.uk → documentation développeur → "CORE API" → inscription (immédiate). Sans clé, un
// accès anonyme très limité existe (vérifié manuellement : x-ratelimit-limit: 10, sans doute
// par minute) mais n'est pas fait pour un usage applicatif soutenu — CORE_API_KEY absente :
// source désactivée, un seul avertissement au premier appel (pas à chaque mémoire analysé).
// Format de requête et de réponse vérifiés en direct contre l'API réelle (accès anonyme) lors
// de cette itération — mécaniquement identique en authentifié, seul le quota diffère.

interface CoreWork {
  title?: string;
  abstract?: string;
  id?: number;
  links?: Array<{ type: string; url: string }>;
}

let hasWarnedMissingCoreKey = false;

export async function searchCore(query: string): Promise<ExternalCandidate[]> {
  const apiKey = process.env.CORE_API_KEY;
  if (!apiKey) {
    if (!hasWarnedMissingCoreKey) {
      console.warn(
        "CORE_API_KEY absente — recherche CORE désactivée pour l'anti-plagiat externe.",
      );
      hasWarnedMissingCoreKey = true;
    }
    return [];
  }

  try {
    // Termes joints par OR explicite : CORE (Elasticsearch) combine les mots d'une requête
    // sans opérateur en AND implicite, ce qui ne renvoie quasiment aucun résultat pour une
    // liste de mots-clés indépendants (vérifié : 0 résultat sans OR, des milliers avec).
    const orQuery = query.trim().split(/\s+/).join(" OR ");
    const url =
      `https://api.core.ac.uk/v3/search/works/?q=${encodeURIComponent(orQuery)}&limit=${MAX_RESULTS_PER_SOURCE}`;

    const data = (await fetchJson(url, { headers: { Authorization: `Bearer ${apiKey}` } })) as {
      results?: CoreWork[];
    };

    return (data.results ?? [])
      .filter((work): work is CoreWork & { title: string; id: number } => Boolean(work.title && work.id))
      .map((work) => ({
        source: "CORE" as const,
        title: work.title,
        url: work.links?.find((link) => link.type === "display")?.url ?? `https://core.ac.uk/works/${work.id}`,
        text: [work.title, work.abstract].filter(Boolean).join(". "),
      }));
  } catch (error) {
    console.error("Recherche CORE échouée :", error);
    return [];
  }
}
