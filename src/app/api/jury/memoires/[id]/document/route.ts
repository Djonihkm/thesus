// src/app/api/jury/memoires/[id]/document/route.ts
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchBlobBuffer } from "@/lib/memoire-processing";

function renderDocxPage(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.7; max-width: 720px;
    margin: 0 auto; padding: 48px 32px 96px; color: #1a1a1a; }
  h1, h2, h3 { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  img { max-width: 100%; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "JURY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const [jury, memoire] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.memoire.findUnique({ where: { id } }),
  ]);

  if (
    !memoire ||
    !jury?.institutionId ||
    memoire.institutionId !== jury.institutionId ||
    memoire.status !== "COMPLETED"
  ) {
    return NextResponse.json({ error: "Mémoire introuvable." }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await fetchBlobBuffer(memoire.fileUrl);
  } catch {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  if (memoire.fileType === "PDF") {
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `inline; filename="${encodeURIComponent(memoire.title)}.pdf"`,
        "Cache-Control": "private, no-store",
        "Accept-Ranges": "none",
      },
    });
  }

  const { value: bodyHtml } = await mammoth.convertToHtml({ buffer });
  return new NextResponse(renderDocxPage(bodyHtml, memoire.title), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
