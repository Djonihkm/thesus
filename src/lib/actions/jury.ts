"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJurySimulation } from "@/lib/jury";
import type { GenerateModuleActionState } from "@/lib/actions/quiz";

export async function generateJuryAction(memoireId: string): Promise<GenerateModuleActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }
  if (memoire.status !== "COMPLETED" || !memoire.extractedText) {
    return {
      error: "L'audit du mémoire doit être terminé avant de générer les questions de jury.",
    };
  }

  const existing = await prisma.jurySimulation.findUnique({ where: { memoireId } });
  if (existing) {
    return { success: true };
  }

  try {
    const questions = await generateJurySimulation(memoire.extractedText);

    await prisma.jurySimulation.create({
      data: {
        memoireId,
        questions: {
          create: questions.map((question) => ({
            category: question.category,
            question: question.question,
            order: question.order,
          })),
        },
      },
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Échec de la génération des questions de jury.",
    };
  }

  revalidatePath(`/dashboard/etudiant/memoires/${memoireId}/jury`);
  revalidatePath(`/dashboard/etudiant/memoires/${memoireId}`);
  return { success: true };
}
