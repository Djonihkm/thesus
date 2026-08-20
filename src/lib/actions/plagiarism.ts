"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPlagiarismCheck } from "@/lib/plagiarism";

export type RecomputePlagiarismState = { error?: string; success?: boolean };

// Relance l'analyse anti-plagiat pour un mémoire déjà traité — utile en particulier pour les
// mémoires déposés avant l'ajout de la granularité par passage (signature encore au format
// "vecteur à plat", voir plagiarism.ts) : la relancer régénère leur signature au nouveau
// format chunké, ce qui débloque au passage le détail des passages pour tout AUTRE mémoire
// qui les cite ensuite comme candidat — mais pas rétroactivement pour les rapports déjà
// générés ailleurs, qui restent figés tant qu'ils ne sont pas eux-mêmes relancés.
export async function recomputePlagiarismReportAction(
  memoireId: string,
): Promise<RecomputePlagiarismState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }
  if (!memoire.extractedText) {
    return { error: "Ce mémoire n'a pas de texte extrait à analyser." };
  }

  try {
    await runPlagiarismCheck(memoireId, memoire.extractedText);
  } catch {
    return { error: "L'analyse anti-plagiat a échoué. Réessayez plus tard." };
  }

  revalidatePath(`/dashboard/etudiant/memoires/${memoireId}/plagiat`);
  return { success: true };
}
