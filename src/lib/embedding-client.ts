// src/lib/embedding-client.ts
// Point d'entrée unique vers le modèle d'embeddings local (open-source, via transformers.js) —
// utilisé par le module anti-plagiat pour la comparaison sémantique, sans dépendance externe payante.
import os from "node:os";
import path from "node:path";
import type { FeatureExtractionPipeline } from "@xenova/transformers";

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

// Import dynamique volontaire (pas d'import statique de @xenova/transformers en tête de
// fichier) : ce package charge un binaire natif (onnxruntime) absent des environnements
// serverless comme Vercel. En import statique, l'échec de chargement se produit dès
// l'évaluation du module — donc dès que n'importe quel fichier de la chaîne d'imports
// (jusqu'à l'action de dépôt de mémoire) est chargé, avant même d'atteindre le try/catch
// non-bloquant autour de runPlagiarismCheck dans memoire-processing.ts. En le différant ici,
// l'échec ne survient qu'au moment de l'appel à embedText, où il redevient une erreur
// d'exécution normale, interceptée par ce try/catch au lieu de faire planter toute la route.
function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = import("@xenova/transformers").then(({ env, pipeline }) => {
      env.cacheDir = path.join(os.tmpdir(), "thesus-transformers-cache");
      env.allowLocalModels = false;
      return pipeline("feature-extraction", MODEL_ID) as Promise<FeatureExtractionPipeline>;
    });
  }
  return extractorPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}
