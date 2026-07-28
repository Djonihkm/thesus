import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@xenova/transformers", "onnxruntime-node"],
};

export default nextConfig;
