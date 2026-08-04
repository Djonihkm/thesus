"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AssignmentActionState = {
  error?: string;
  success?: boolean;
};

// Même souci que les mutations de thème (voir src/lib/actions/themes.ts) : ces routes
// sont dynamiques (pas de Full Route Cache), donc c'est le Router Cache côté client qu'il
// faut invalider, sinon la page qui vient de déclencher l'action reste affichée avec des
// données obsolètes jusqu'à un rechargement manuel.
function revalidateAssignmentPaths(memoireId: string, juryId: string) {
  revalidatePath("/dashboard/etablissement/memoires");
  revalidatePath("/dashboard/etablissement");
  revalidatePath("/dashboard/etablissement/jurys");
  revalidatePath(`/dashboard/etablissement/jurys/${juryId}`);
  revalidatePath("/dashboard/jury");
  revalidatePath("/dashboard/jury/memoires");
  revalidatePath(`/dashboard/etudiant/memoires/${memoireId}`);
}

// Établissement : valide la suggestion (calculée à l'affichage, voir
// src/lib/jury-assignment.ts) ou choisit un autre jury manuellement — les deux passent
// par la même action, qui crée directement une ligne VALIDATED. Le statut SUGGESTED reste
// dans le schéma pour un éventuel futur pipeline d'auto-suggestion persistée, mais aucune
// suggestion n'est écrite en base tant qu'elle n'est pas validée.
export async function assignJuryToMemoireAction(
  memoireId: string,
  juryId: string,
): Promise<AssignmentActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTITUTION") {
    return { error: "Vous devez être connecté en tant qu'établissement." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.institutionId) {
    return { error: "Établissement introuvable." };
  }

  const [memoire, jury] = await Promise.all([
    prisma.memoire.findUnique({ where: { id: memoireId } }),
    prisma.user.findUnique({ where: { id: juryId } }),
  ]);

  if (!memoire || memoire.institutionId !== user.institutionId) {
    return { error: "Mémoire introuvable." };
  }
  if (!jury || jury.role !== "JURY" || jury.institutionId !== user.institutionId) {
    return { error: "Jury introuvable dans votre établissement." };
  }

  await prisma.memoireAssignment.create({
    data: { memoireId, juryId, status: "VALIDATED" },
  });

  revalidateAssignmentPaths(memoireId, juryId);
  return { success: true };
}
