// src/app/api/y-sweet-auth/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDocumentManager, documentRoomId } from "@/lib/y-sweet";
import { canAccessMemoireDocument } from "@/lib/document-access";
import { logError } from "@/lib/log-error";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { docId } = (await request.json()) as { docId?: string };
  if (!docId) {
    return NextResponse.json({ error: "Document manquant." }, { status: 400 });
  }

  const [, memoireId] = docId.match(/^memoire-(.+)-v\d+$/) ?? [];
  if (!memoireId) {
    return NextResponse.json({ error: "Document invalide." }, { status: 400 });
  }

  const [user, memoire] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.memoire.findUnique({ where: { id: memoireId } }),
  ]);

  // On ne fait jamais confiance au docId fourni par le client : on revérifie nous-mêmes le
  // droit d'accès en base, et que le docId correspond bien à la version courante du document
  // (pas une version antérieure à une régénération).
  if (!user || !memoire || docId !== documentRoomId(memoireId, memoire.documentRoomVersion)) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  if (!canAccessMemoireDocument(user, memoire)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    // Y-Sweet n'a pas de permission plus fine que lecture/écriture complète par document
    // (comme Liveblocks avant lui) : la restriction "le jury ne peut que surligner/commenter,
    // pas modifier le texte" est appliquée côté éditeur (plugin ProseMirror qui rejette les
    // transactions de contenu, voir annotate-only-plugin.ts), pas au niveau de ce token. Un
    // contournement technique de cette barrière client reste possible — voir le filet détectif
    // (pas préventif) dans document-integrity.ts, qui journalise toute dérive de texte détectée
    // par rapport au dernier checkpoint étudiant.
    const clientToken = await getDocumentManager().getOrCreateDocAndToken(docId, {
      authorization: "full",
      userId: user.id,
    });
    return NextResponse.json(clientToken);
  } catch (error) {
    logError("y-sweet-auth", error);
    return NextResponse.json(
      { error: "Le service de collaboration est momentanément indisponible." },
      { status: 503 },
    );
  }
}
