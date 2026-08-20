// src/lib/document-access.ts
//
// Règle d'accès partagée à la vue document d'un mémoire (éditeur TipTap, document
// collaboratif Y-Sweet, images extraites) — utilisée à la fois par la route d'auth
// Y-Sweet et par la route de service des images, pour ne pas dupliquer (et risquer de
// faire diverger) la logique d'autorisation.
import type { Memoire, User } from "@prisma/client";

export function canAccessMemoireDocument(user: User, memoire: Memoire): boolean {
  const isOwner = memoire.studentId === user.id;
  const isJuryOfInstitution =
    user.role === "JURY" &&
    !!user.institutionId &&
    user.institutionId === memoire.institutionId &&
    memoire.status === "COMPLETED";

  return isOwner || isJuryOfInstitution;
}
