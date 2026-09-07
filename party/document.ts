// party/document.ts
//
// Serveur de collaboration temps réel (remplace Y-Sweet — voir src/lib/partykit.ts et
// src/app/api/party-auth/route.ts). Une room par document (`documentRoomId`, voir
// src/lib/partykit.ts) ; Neon (Memoire.editableContent) reste la seule source de vérité du
// contenu — cette room n'est qu'une session de travail live, jamais consultée en dehors
// d'une édition en cours (voir l'amorçage/la sauvegarde dans DocumentEditor.tsx).
//
// Import relatif (pas l'alias "@/...") : le bundler de PartyKit ne lit pas forcément le
// tsconfig de l'app Next.js.
import type * as Party from "partykit/server";
import { onConnect, unstable_getYDoc } from "y-partykit";
import * as Y from "yjs";
import { verifyPartyToken } from "../src/lib/party-token";

export default class DocumentServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Rejette la connexion avant même l'upgrade WebSocket (et avant toute instanciation de
  // ce serveur pour la room) si le jeton signé par /api/party-auth est absent, invalide,
  // expiré, ou ne correspond pas à la room ciblée — voir src/app/api/party-auth/route.ts
  // pour l'émission du jeton et les vérifications d'accès (session, appartenance du
  // mémoire, canAccessMemoireDocument) qui ont lieu côté Next.js avant signature.
  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
  ): Promise<Party.Request | Response> {
    const secret = lobby.env.PARTYKIT_AUTH_SECRET as string | undefined;
    const token = new URL(req.url).searchParams.get("token");
    if (!secret || !token) {
      return new Response("Non autorisé.", { status: 401 });
    }

    const payload = await verifyPartyToken(token, secret);
    if (!payload || payload.docId !== lobby.id) {
      return new Response("Non autorisé.", { status: 401 });
    }

    return req;
  }

  async onConnect(connection: Party.Connection): Promise<void> {
    await onConnect(connection, this.room, { persist: { mode: "snapshot" } });
  }

  // Filet détectif d'intégrité — voir src/lib/document-integrity.ts : lit l'état live du
  // document pour le comparer au dernier checkpoint Neon. Appel serveur-à-serveur
  // uniquement (jamais depuis le navigateur), protégé par un secret distinct de celui des
  // connexions utilisateur.
  async onRequest(req: Party.Request): Promise<Response> {
    const secret = this.room.env.PARTYKIT_INTERNAL_SECRET as string | undefined;
    if (!secret || req.headers.get("x-internal-secret") !== secret) {
      return new Response("Non autorisé.", { status: 401 });
    }

    const doc = await unstable_getYDoc(this.room, { persist: { mode: "snapshot" } });
    // `as BlobPart` : lib.dom.d.ts type ici Uint8Array.buffer en ArrayBufferLike (englobant
    // SharedArrayBuffer), plus étroit que ce que Blob accepte réellement — jamais de
    // SharedArrayBuffer en jeu dans ce contexte.
    return new Response(new Blob([Y.encodeStateAsUpdate(doc) as BlobPart]), {
      headers: { "content-type": "application/octet-stream" },
    });
  }
}
