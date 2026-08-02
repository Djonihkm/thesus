// src/app/api/liveblocks-auth/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { liveblocks, documentRoomId } from "@/lib/liveblocks";
import { canAccessMemoireDocument } from "@/lib/document-access";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { room } = (await request.json()) as { room?: string };
  if (!room) {
    return NextResponse.json({ error: "Room manquante." }, { status: 400 });
  }

  // On ne fait jamais confiance au nom de room fourni par le client : on en extrait
  // l'identifiant de mémoire et on revérifie nous-mêmes le droit d'accès en base.
  const memoireId = room.startsWith("memoire-") ? room.slice("memoire-".length) : null;
  if (!memoireId || room !== documentRoomId(memoireId)) {
    return NextResponse.json({ error: "Room invalide." }, { status: 400 });
  }

  const [user, memoire] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.memoire.findUnique({ where: { id: memoireId } }),
  ]);

  if (!user || !memoire) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  if (!canAccessMemoireDocument(user, memoire)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const lbSession = liveblocks.prepareSession(user.id, {
    userInfo: { name: user.name },
  });

  // Liveblocks n'a pas de permission plus fine que lecture/écriture complète par room
  // (accès storage + commentaires) : la restriction "le jury ne peut que surligner/
  // commenter, pas modifier le texte" est appliquée côté éditeur (plugin ProseMirror
  // qui rejette les transactions de contenu), pas au niveau de cette permission.
  lbSession.allow(room, ["*:write"]);

  const { status, body } = await lbSession.authorize();
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
