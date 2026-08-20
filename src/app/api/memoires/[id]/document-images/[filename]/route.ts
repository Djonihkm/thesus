// src/app/api/memoires/[id]/document-images/[filename]/route.ts
//
// Sert les images extraites du document éditable (stockées sur Vercel Blob en accès
// privé) — même règle d'accès que le document collaboratif Y-Sweet (propriétaire étudiant
// ou jury de la même institution une fois le mémoire COMPLETED).
import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessMemoireDocument } from "@/lib/document-access";
import { documentImagePathname } from "@/lib/document-images";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await params;
  const session = await auth();
  if (!session?.user) {
    return new NextResponse(null, { status: 401 });
  }

  const [user, memoire] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.memoire.findUnique({ where: { id } }),
  ]);

  if (!user || !memoire || !canAccessMemoireDocument(user, memoire)) {
    return new NextResponse(null, { status: 404 });
  }

  const result = await get(documentImagePathname(id, filename), { access: "private" });
  if (!result || result.statusCode !== 200) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
