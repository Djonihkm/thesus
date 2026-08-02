import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdfjs-dist",
    "@xenova/transformers",
    "onnxruntime-node",
    "@adobe/pdfservices-node-sdk",
  ],
};

export default nextConfig;
