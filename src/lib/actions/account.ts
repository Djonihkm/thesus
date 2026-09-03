"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStudyLevel, isValidPassword, isValidUrl, PASSWORD_MIN_LENGTH } from "@/lib/validation";

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

// Jury : équivalent de updateProfileAction pour un compte jury — champs entièrement
// différents (spécialité plutôt que filière/niveau d'étude), donc une action séparée plutôt
// qu'un branchement par rôle dans la même fonction.
export async function updateJuryProfileAction(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "JURY") {
    return { error: "Vous devez être connecté en tant que membre du jury." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();

  if (!name) {
    return { error: "Indiquez votre nom complet." };
  }
  if (!specialty) {
    return { error: "Indiquez votre spécialité ou domaine d'expertise." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, specialty },
  });

  revalidatePath("/dashboard/jury/mon-compte");
  return { success: true };
}

// Établissement : nom du responsable (User.name) + informations de l'Institution
// (nom/pays/ville/site web). Contrairement à STUDENT/JURY, deux modèles à mettre à jour ici —
// transaction pour ne jamais laisser l'un modifié sans l'autre en cas d'échec partiel. Le
// slug de l'Institution (identifiant technique) n'est volontairement pas exposé : un
// changement de nom d'affichage ne doit pas casser les références existantes qui s'appuient
// dessus.
export async function updateInstitutionProfileAction(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTITUTION") {
    return { error: "Vous devez être connecté en tant qu'établissement." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const institutionName = String(formData.get("institutionName") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;

  if (!name) {
    return { error: "Indiquez le nom du responsable." };
  }
  if (!institutionName) {
    return { error: "Indiquez le nom de l'établissement." };
  }
  if (website && !isValidUrl(website)) {
    return { error: "L'adresse du site web ne semble pas valide." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.institutionId) {
    return { error: "Établissement introuvable." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name } }),
    prisma.institution.update({
      where: { id: user.institutionId },
      data: { name: institutionName, country, city, website },
    }),
  ]);

  revalidatePath("/dashboard/etablissement/mon-compte");
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
