// src/lib/party-token.ts
//
// Jeton court signé prouvant qu'un utilisateur a le droit de rejoindre une room PartyKit
// donnée — voir src/app/api/party-auth/route.ts (émetteur, tourne sur Next.js) et
// party/document.ts (vérificateur, tourne sur Cloudflare Workers). Les deux environnements
// n'ont pas de module commun garanti (pas de `node:crypto` sur Workers) : Web Crypto
// (`crypto.subtle`) est la seule API HMAC disponible des deux côtés, d'où son usage ici
// plutôt qu'une dépendance JWT complète, inutile pour un payload aussi simple.
export interface PartyTokenPayload {
  docId: string;
  userId: string;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

// `as BufferSource` : la génération TS/lib.dom.d.ts de cet environnement type
// `Uint8Array.prototype.buffer` en `ArrayBufferLike` (englobant SharedArrayBuffer), plus
// étroit que ce que Web Crypto accepte réellement — nos buffers sont toujours de vrais
// ArrayBuffer, jamais partagés (aucun Worker/SharedArrayBuffer en jeu ici).
async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signPartyToken(payload: PartyTokenPayload, secret: string): Promise<string> {
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    new TextEncoder().encode(body) as BufferSource,
  );
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

// Renvoie le payload si la signature est valide ET non expirée, sinon null — jamais
// d'exception, pour que l'appelant traite systématiquement un jeton invalide comme un accès
// refusé plutôt que comme une erreur serveur.
export async function verifyPartyToken(token: string, secret: string): Promise<PartyTokenPayload | null> {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      base64UrlDecode(signature) as BufferSource,
      new TextEncoder().encode(body) as BufferSource,
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as PartyTokenPayload;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (typeof payload.docId !== "string" || typeof payload.userId !== "string") return null;

    return payload;
  } catch {
    return null;
  }
}
