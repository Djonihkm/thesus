// src/lib/y-sweet.ts
import { DocumentManager } from "@y-sweet/sdk";

// Miroir de l'ancien documentRoomId (src/lib/liveblocks.ts) — le suffixe de version permet
// d'obtenir un document Yjs neuf sans équivalent Y-Sweet à la suppression de room Liveblocks
// (voir Memoire.documentRoomVersion dans le schéma).
export function documentRoomId(memoireId: string, roomVersion: number): string {
  return `memoire-${memoireId}-v${roomVersion}`;
}

let manager: DocumentManager | null = null;

// Levé volontairement au premier accès (pas au chargement du module) : une variable
// d'environnement manquante ne doit faire échouer que les requêtes qui touchent réellement
// au document collaboratif, pas toute route qui importe ce fichier.
export function getDocumentManager(): DocumentManager {
  if (!manager) {
    const connectionString = process.env.Y_SWEET_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("Y_SWEET_CONNECTION_STRING n'est pas configurée.");
    }
    manager = new DocumentManager(connectionString);
  }
  return manager;
}
