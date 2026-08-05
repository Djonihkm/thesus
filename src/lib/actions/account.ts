"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStudyLevel, isValidPassword, PASSWORD_MIN_LENGTH } from "@/lib/validation";

export type AccountFormState = {
  error?: string;
  success?: boolean;
};

export async function updateProfileAction(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const fieldOfStudy = String(formData.get("fieldOfStudy") ?? "").trim();
  const studyLevelValue = formData.get("studyLevel");
  const studentNumber = String(formData.get("studentNumber") ?? "").trim() || null;

  if (!name) {
    return { error: "Indiquez votre nom complet." };
  }
  if (!country) {
    return { error: "Indiquez votre pays." };
  }
  if (!fieldOfStudy) {
    return { error: "Indiquez votre filière." };
  }
  if (!isStudyLevel(studyLevelValue)) {
    return { error: "Choisissez votre niveau d'étude." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      country,
      fieldOfStudy,
      studyLevel: studyLevelValue,
      studentNumber,
    },
  });

  revalidatePath("/dashboard/etudiant/mon-compte");
  return { success: true };
}

export async function changePasswordAction(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Vous devez être connecté." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!isValidPassword(newPassword)) {
    return {
      error: `Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "Compte introuvable." };
  }

  const currentPasswordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentPasswordMatches) {
    return { error: "Mot de passe actuel incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    // mustChangePassword : sans effet si déjà false (changement volontaire depuis "Mon
    // compte"), lève l'obligation si ce changement répond à la redirection forcée
    // (voir requireRole dans src/lib/auth-guard.ts).
    data: { passwordHash, mustChangePassword: false },
  });

  return { success: true };
}
