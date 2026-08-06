// src/app/api/liveblocks-resolve-users/route.ts
//
// Résout les userId Liveblocks (= User.id, voir liveblocks.prepareSession dans
// /api/liveblocks-auth) en informations d'affichage — appelé côté client par le
// `resolveUsers` du LiveblocksProvider pour afficher le vrai nom sur les commentaires,
// notamment ceux d'un auteur qui n'est plus présent dans la room (pas résolvable via la
// présence temps réel seule).
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { userIds } = (await request.json()) as { userIds?: unknown };
  if (!Array.isArray(userIds) || !userIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "userIds invalide." }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const byId = new Map(users.map((user) => [user.id, user]));

  // Même forme que userInfo dans liveblocks.prepareSession — un id sans correspondance
  // (compte supprimé) renvoie undefined à sa position, comme attend resolveUsers.
  const results = userIds.map((id) => {
    const user = byId.get(id);
    return user ? { name: user.name } : undefined;
  });

  return NextResponse.json(results);
}
