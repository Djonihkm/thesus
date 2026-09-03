"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyInstitution } from "@/lib/notifications";
import { EVALUATION_CRITERIA_LABELS, type EvaluationCriterion } from "@/lib/evaluation-criteria";

export type EvaluationFormState = {
  error?: string;
  success?: boolean;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(20, value));
}

export async function submitEvaluationAction(
  memoireId: string,
  _prevState: EvaluationFormState,
  formData: FormData,
): Promise<EvaluationFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "JURY") {
    return { error: "Vous devez être connecté en tant que membre du jury." };
  }

  const [memoire, jury] = await Promise.all([
    prisma.memoire.findUnique({ where: { id: memoireId } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (!memoire) {
    return { error: "Mémoire introuvable." };
  }
  if (!jury || !jury.institutionId || jury.institutionId !== memoire.institutionId) {
    return { error: "Ce mémoire n'appartient pas à votre établissement." };
  }
  if (memoire.status !== "COMPLETED") {
    return { error: "Ce mémoire n'est pas encore prêt à être évalué." };
  }

  const criteria: EvaluationCriterion[] = EVALUATION_CRITERIA_LABELS.map((label) => {
    const raw = Number(formData.get(`criterion-${label}`));
    return { label, score: clampScore(Number.isFinite(raw) ? raw : 0) };
  });

  const comments = String(formData.get("comments") ?? "").trim() || null;
  const grade =
    Math.round((criteria.reduce((sum, criterion) => sum + criterion.score, 0) / criteria.length) * 10) /
    10;

  const existing = await prisma.defenseEvaluation.findFirst({
    where: { memoireId, juryId: session.user.id },
  });

  const isRevision = Boolean(existing);

  if (existing) {
    await prisma.defenseEvaluation.update({
      where: { id: existing.id },
      data: { grade, criteria: criteria as unknown as Prisma.InputJsonValue, comments },
    });
  } else {
    await prisma.defenseEvaluation.create({
      data: {
        memoireId,
        juryId: session.user.id,
        grade,
        criteria: criteria as unknown as Prisma.InputJsonValue,
        comments,
      },
    });
  }

  revalidatePath(`/dashboard/jury/memoires/${memoireId}`);
  revalidatePath("/dashboard/jury/memoires");
  revalidatePath("/dashboard/jury");
  revalidatePath("/dashboard/jury/grilles");
  revalidatePath("/dashboard/etudiant/evaluation");

  // Le formulaire "Revoir / modifier" (voir ReviewEvaluationModal.tsx) permet à un jury de
  // réviser une évaluation déjà soumise — délibéré, pas une lacune. Ce qui manquait :
  // updatedAt sur DefenseEvaluation (traçabilité, ajouté au schéma) et un message distinct
  // ici pour qu'une révision ne soit pas silencieusement confondue avec l'évaluation
  // initiale, côté étudiant ET côté établissement.
  if (isRevision) {
    await Promise.all([
      createNotification(
        memoire.studentId,
        "Votre note de soutenance a été révisée par le jury.",
        `/dashboard/etudiant/memoires/${memoireId}`,
      ),
      notifyInstitution(
        // Non-null garanti par la garde ligne 37 (jury.institutionId === memoire.institutionId,
        // et jury.institutionId déjà vérifié truthy) — TS ne propage pas cette égalité ici.
        memoire.institutionId!,
        `${jury.name} a révisé son évaluation de soutenance pour « ${memoire.title} ».`,
        "/dashboard/etablissement/memoires",
      ),
    ]);
  } else {
    await createNotification(
      memoire.studentId,
      "Votre soutenance a été évaluée.",
      `/dashboard/etudiant/memoires/${memoireId}`,
    );
  }

  return { success: true };
}
