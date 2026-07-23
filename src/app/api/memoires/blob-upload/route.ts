// src/app/api/memoires/blob-upload/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/memoire-upload";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session?.user || session.user.role !== "STUDENT") {
          throw new Error(
            "Vous devez être connecté en tant qu'étudiant pour déposer un mémoire.",
          );
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // La création du Memoire en base est gérée côté client via createMemoireAction
        // une fois l'upload terminé — ce webhook n'est pas fiable en développement local.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'upload." },
      { status: 400 },
    );
  }
}
