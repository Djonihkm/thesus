"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { generateTemporaryPassword } from "@/lib/password-generator";
import { sendJuryAccountCreatedEmail } from "@/lib/email";
import { getInstitutionJuryWorkload } from "@/lib/jury-workload";
import { canAddJury } from "@/lib/subscription";

export type CreateJuryAccountActionState = {
  error?: string;
  success?: boolean;
};

async function requireInstitutionJury(juryId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTITUTION") {
    return { error: "Vous devez être connecté en tant qu'établissement." } as const;
  }

  const [institutionUser, jury] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.user.findUnique({ where: { id: juryId } }),
  ]);

  if (
    !institutionUser?.institutionId ||
    !jury ||
    jury.role !== "JURY" ||
    jury.institutionId !== institutionUser.institutionId
  ) {
    return { error: "Jury introuvable." } as const;
  }

  return { institutionId: institutionUser.institutionId, jury } as const;
}

function revalidateJuryPaths(juryId: string) {
  revalidatePath("/dashboard/etablissement/jurys");
  revalidatePath(`/dashboard/etablissement/jurys/${juryId}`);
  revalidatePath("/dashboard/etablissement");
  revalidatePath("/dashboard/etablissement/memoires");
}

// Établissement : crée directement un compte jury (sans passer par l'auto-inscription),
// avec un mot de passe temporaire envoyé par email. emailVerified est renseigné
// immédiatement — l'établissement vouche pour ce compte en le créant lui-même, inutile de
// repasser par la confirmation email. mustChangePassword force un changement de mot de
// passe à la première connexion (voir requireRole dans src/lib/auth-guard.ts).
export async function createJuryAccountAction(input: {
  name: string;
  email: string;
  specialty: string;
}): Promise<CreateJuryAccountActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTITUTION") {
    return { error: "Vous devez être connecté en tant qu'établissement." };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const specialty = input.specialty.trim();

  if (!name) {
    return { error: "Indiquez le nom du jury." };
  }
  if (!isValidEmail(email)) {
    return { error: "Cette adresse email ne semble pas valide." };
  }
  if (!specialty) {
    return { error: "Indiquez la spécialité ou le domaine d'expertise." };
  }

  const [institutionUser, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.user.findUnique({ where: { email } }),
  ]);

  if (!institutionUser?.institutionId) {
    return { error: "Établissement introuvable." };
  }
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse email." };
  }

  const juryLimit = await canAddJury(institutionUser.institutionId);
  if (!juryLimit.allowed) {
    return { error: juryLimit.reason };
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "JURY",
      institutionId: institutionUser.institutionId,
      specialty,
      emailVerified: new Date(),
      mustChangePassword: true,
    },
  });

  try {
    await sendJuryAccountCreatedEmail(email, name, temporaryPassword);
  } catch {
    return {
      error:
        "Le compte a été créé mais l'email contenant les identifiants n'a pas pu être envoyé. Contactez le support pour transmettre le mot de passe temporaire.",
    };
  }

  revalidateJuryPaths(created.id);
  return { success: true };
}

export type UpdateJuryAccountActionState = {
  error?: string;
  success?: boolean;
};

// Établissement : modifie le nom et la spécialité d'un compte jury déjà créé. L'email et
// le mot de passe ne se changent pas ici (l'email est l'identifiant de connexion, un
// changement d'email mériterait sa propre vérification — hors périmètre de cette
// itération ; le mot de passe reste du ressort du jury lui-même une fois connecté).
export async function updateJuryAccountAction(
  juryId: string,
  input: { name: string; specialty: string },
): Promise<UpdateJuryAccountActionState> {
  const result = await requireInstitutionJury(juryId);
  if ("error" in result) return { error: result.error };

  const name = input.name.trim();
  const specialty = input.specialty.trim();

  if (!name) {
    return { error: "Indiquez le nom du jury." };
  }
  if (!specialty) {
    return { error: "Indiquez la spécialité ou le domaine d'expertise." };
  }

  await prisma.user.update({
    where: { id: juryId },
    data: { name, specialty },
  });

  revalidateJuryPaths(juryId);
  return { success: true };
}

export type DeleteJuryAccountActionState = {
  error?: string;
  success?: boolean;
};

// Établissement : supprime un compte jury. Bloqué si le jury a des mémoires actuellement
// assignés (status VALIDATED sur la ligne d'assignation la plus récente) — l'établissement
// doit d'abord réassigner ces mémoires à un autre jury, plutôt qu'une libération
// automatique et silencieuse qui ferait disparaître un encadrant sans que personne ne le
// remarque. Bloqué aussi si le jury a déjà soumis des évaluations de soutenance : ce sont
// des notes définitives, à la différence d'une simple assignation, et il n'existe aucune
// action "annuler une évaluation" pour en sortir — les perdre silencieusement serait pire
// que le petit désagrément de ne pas pouvoir supprimer ce compte. Dans les deux cas,
// aucune suppression partielle n'a lieu : ou la suppression est possible entièrement, ou
// elle est refusée avec un message explicite.
export async function deleteJuryAccountAction(juryId: string): Promise<DeleteJuryAccountActionState> {
  const result = await requireInstitutionJury(juryId);
  if ("error" in result) return { error: result.error };

  const [workload, evaluationCount] = await Promise.all([
    getInstitutionJuryWorkload(result.institutionId),
    prisma.defenseEvaluation.count({ where: { juryId } }),
  ]);

  const assignedCount = (workload.get(juryId) ?? []).length;
  if (assignedCount > 0) {
    return {
      error: `Ce jury a ${assignedCount} mémoire${assignedCount > 1 ? "s" : ""} assigné${assignedCount > 1 ? "s" : ""} — réassignez-les à un autre jury avant de supprimer ce compte.`,
    };
  }
  if (evaluationCount > 0) {
    return {
      error: `Ce jury a déjà soumis ${evaluationCount} évaluation${evaluationCount > 1 ? "s" : ""} de soutenance — ce compte ne peut pas être supprimé tant que ces évaluations existent.`,
    };
  }

  // Aucune assignation active, mais il peut rester des lignes d'assignation historiques
  // (superseded par une réassignation ultérieure) référençant ce jury — à nettoyer pour
  // satisfaire la contrainte de clé étrangère (pas de cascade sur MemoireAssignment.jury).
  await prisma.$transaction([
    prisma.memoireAssignment.deleteMany({ where: { juryId } }),
    prisma.user.delete({ where: { id: juryId } }),
  ]);

  revalidateJuryPaths(juryId);
  return { success: true };
}
