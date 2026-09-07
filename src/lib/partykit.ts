// src/lib/partykit.ts
import { signPartyToken } from "@/lib/party-token";

// Identique à l'ancien documentRoomId (src/lib/y-sweet.ts, désormais supprimé) — le
// suffixe de version permet d'obtenir une room PartyKit neuve à la régénération sans
// équivalent "suppression de room" (voir Memoire.documentRoomVersion dans le schéma).
export function documentRoomId(memoireId: string, roomVersion: number): string {
  return `memoire-${memoireId}-v${roomVersion}`;
}

// process.env.NEXT_PUBLIC_PARTYKIT_HOST : "127.0.0.1:1999" en local (partykit dev),
// "<name>.<user>.partykit.dev" en prod (après `npx partykit deploy`).
export function getPartyKitHost(): string {
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (!host) {
    throw new Error("NEXT_PUBLIC_PARTYKIT_HOST n'est pas configurée.");
  }
  return host;
}

const PARTY_TOKEN_TTL_MS = 60_000;

// Signe le jeton de connexion à une room, une fois l'accès déjà vérifié par l'appelant
// (voir src/app/api/party-auth/route.ts) — validité courte, une room par connexion.
export async function issuePartyToken(docId: string, userId: string): Promise<string> {
  const secret = process.env.PARTYKIT_AUTH_SECRET;
  if (!secret) {
    throw new Error("PARTYKIT_AUTH_SECRET n'est pas configurée.");
  }
  return signPartyToken({ docId, userId, exp: Date.now() + PARTY_TOKEN_TTL_MS }, secret);
}
