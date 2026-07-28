// src/lib/embedding-client.ts
// Point d'entrée unique vers le modèle d'embeddings local (open-source, via transformers.js) —
// utilisé par le module anti-plagiat pour la comparaison sémantique, sans dépendance externe payante.
import os from "node:os";
import path from "node:path";
import { env, pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

env.cacheDir = path.join(os.tmpdir(), "thesus-transformers-cache");
env.allowLocalModels = false;

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_ID) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}
