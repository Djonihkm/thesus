import { defineConfig } from "vitest/config";
import path from "node:path";

// Périmètre volontairement limité aux fonctions pures (validation, autorisation d'accès,
// recherche de texte, tarification...) — pas de tests d'intégration contre une vraie base de
// données dans cette première passe (aucune infra de test DB dédiée aujourd'hui), voir
// AUDIT.md pour le détail de ce qui est couvert et pourquoi.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
