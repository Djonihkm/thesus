import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdfjs-dist",
    "@xenova/transformers",
    "onnxruntime-node",
    "@adobe/pdfservices-node-sdk",
  ],
  // onnxruntime-node (utilisé par @xenova/transformers pour l'anti-plagiat) résout son
  // binaire natif dynamiquement selon process.platform/arch — le traceur de fichiers de
  // Vercel ne le détecte pas via analyse statique et l'omet du bundle serverless, d'où
  // "libonnxruntime.so cannot open shared object file" en prod. On le force ici.
  outputFileTracingIncludes: {
    "/*": ["node_modules/onnxruntime-node/bin/napi-v3/linux/**/*"],
  },
};

export default nextConfig;
