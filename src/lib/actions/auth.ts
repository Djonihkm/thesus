"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut, EmailNotVerifiedError } from "@/lib/auth";
import { createAuthToken, consumeAuthToken, getSecondsUntilResendAllowed } from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import {
  isValidEmail,
  isValidPassword,
  isValidUrl,
  isRole,
  isStudyLevel,
  isJuryFunction,
  PASSWORD_MIN_LENGTH,
  ROLE_DASHBOARD_PATH,
} from "@/lib/validation";

export type AuthFormState = {
  error?: string;
  success?: boolean;
};

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "etablissement"
  );
}

async function findMatchingInstitutionId(name: string): Promise<string | null> {
  const match = await prisma.institution.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  return match?.id ?? null;
}

async function resolveInstitutionSelection(
  institutionIdInput: string,
  institutionName: string,
): Promise<{ institutionId?: string; affiliatedInstitutionName?: string; error?: string }> {
  if (institutionIdInput) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionIdInput },
      select: { id: true },
    });
    if (!institution) {
      return { error: "L'établissement sélectionné est invalide." };
    }
    return { institutionId: institution.id };
  }

  const matched = await findMatchingInstitutionId(institutionName);
  if (matched) {
    return { institutionId: matched };
  }
  return { affiliatedInstitutionName: institutionName };
}

async function createInstitutionForRegistration(input: {
  name: string;
  country: string;
  city: string;
  website: string;
}): Promise<string> {
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.institution.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const institution = await prisma.institution.create({
    data: {
      name: input.name,
      slug,
      country: input.country,
      city: input.city,
      website: input.website || null,
    },
  });

  return institution.id;
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const roleValue = formData.get("role");

  if (!name) {
    return { error: "Indiquez votre nom complet." };
  }
  if (!isValidEmail(email)) {
    return { error: "Cette adresse email ne semble pas valide." };
  }
  if (!isValidPassword(password)) {
    return {
      error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    };
  }
  if (password !== confirmPassword) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }
  if (!isRole(roleValue)) {
    return { error: "Choisissez un profil pour continuer." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse email." };
  }

  let institutionId: string | undefined;
  let affiliatedInstitutionName: string | undefined;
  let country: string | undefined;
  let fieldOfStudy: string | undefined;
  let studyLevel: "LICENCE" | "MASTER" | "DOCTORAT" | undefined;
  let studentNumber: string | undefined;
  let specialty: string | undefined;
  let juryFunction: "ENSEIGNANT" | "PROFESSIONNEL" | undefined;

  if (roleValue === "STUDENT") {
    country = String(formData.get("country") ?? "").trim();
    const institutionName = String(formData.get("institutionName") ?? "").trim();
    const institutionIdInput = String(formData.get("institutionId") ?? "").trim();
    fieldOfStudy = String(formData.get("fieldOfStudy") ?? "").trim();
    const studyLevelValue = formData.get("studyLevel");
    studentNumber = String(formData.get("studentNumber") ?? "").trim() || undefined;

    if (!country) return { error: "Indiquez votre pays." };
    if (!institutionName) return { error: "Indiquez votre établissement." };
    if (!fieldOfStudy) return { error: "Indiquez votre filière." };
    if (!isStudyLevel(studyLevelValue)) return { error: "Choisissez votre niveau d'étude." };
    studyLevel = studyLevelValue;

    const resolution = await resolveInstitutionSelection(institutionIdInput, institutionName);
    if (resolution.error) return { error: resolution.error };
    institutionId = resolution.institutionId;
    affiliatedInstitutionName = resolution.affiliatedInstitutionName;
  } else if (roleValue === "JURY") {
    const institutionName = String(formData.get("institutionName") ?? "").trim();
    const institutionIdInput = String(formData.get("institutionId") ?? "").trim();
    specialty = String(formData.get("specialty") ?? "").trim();
    const juryFunctionValue = formData.get("juryFunction");

    if (!institutionName) return { error: "Indiquez votre établissement de rattachement." };
    if (!specialty) return { error: "Indiquez votre spécialité ou domaine d'expertise." };
    if (!isJuryFunction(juryFunctionValue)) return { error: "Choisissez votre fonction." };
    juryFunction = juryFunctionValue;

    const resolution = await resolveInstitutionSelection(institutionIdInput, institutionName);
    if (resolution.error) return { error: resolution.error };
    institutionId = resolution.institutionId;
    affiliatedInstitutionName = resolution.affiliatedInstitutionName;
  } else {
    const institutionName = String(formData.get("institutionName") ?? "").trim();
    const institutionCountry = String(formData.get("institutionCountry") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();

    if (!institutionName) return { error: "Indiquez le nom de votre établissement." };
    if (!institutionCountry) return { error: "Indiquez le pays de votre établissement." };
    if (!city) return { error: "Indiquez la ville de votre établissement." };
    if (website && !isValidUrl(website)) {
      return { error: "L'adresse du site web ne semble pas valide." };
    }

    institutionId = await createInstitutionForRegistration({
      name: institutionName,
      country: institutionCountry,
      city,
      website,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: roleValue,
      institutionId,
      affiliatedInstitutionName,
      country,
      fieldOfStudy,
      studyLevel,
      studentNumber,
      specialty,
      juryFunction,
    },
  });

  const token = await createAuthToken(user.id, "EMAIL_VERIFICATION");

  try {
    await sendVerificationEmail(user.email, user.name, token);
  } catch (error) {
    console.error("Échec de l'envoi de l'email de vérification :", error);
    return {
      error:
        "Votre compte a été créé, mais l'email de confirmation n'a pas pu être envoyé. Contactez-nous pour activer votre compte.",
    };
  }

  return { success: true };
}

// Renvoie l'email de vérification depuis l'écran "Vérifiez votre boîte mail" post-inscription
// — l'email est celui déjà saisi à l'étape 1 du formulaire, pas resaisi par l'utilisateur.
// Ne révèle jamais rien sur l'état du compte dans la réponse (compte inexistant, déjà
// vérifié, ou cooldown actif renvoient tous le même succès générique, sans email envoyé) —
// même posture anti-fuite que le mot de passe oublié ci-dessous ; seul un échec technique
// d'envoi est signalé, pour rester cohérent avec la même règle appliquée au renvoi de
// réinitialisation de mot de passe.
export async function resendVerificationEmailAction(email: string): Promise<AuthFormState> {
  const genericSuccess: AuthFormState = { success: true };
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return genericSuccess;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || user.emailVerified) {
    return genericSuccess;
  }

  const cooldownRemaining = await getSecondsUntilResendAllowed(user.id, "EMAIL_VERIFICATION");
  if (cooldownRemaining > 0) {
    return genericSuccess;
  }

  const token = await createAuthToken(user.id, "EMAIL_VERIFICATION");

  try {
    await sendVerificationEmail(user.email, user.name, token);
  } catch (error) {
    console.error("Échec du renvoi de l'email de vérification :", error);
  }

  return genericSuccess;
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return { error: "Adresse email ou mot de passe incorrect." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof EmailNotVerifiedError) {
      return {
        error:
          "Confirmez votre adresse email avant de vous connecter. Vérifiez votre boîte de réception.",
      };
    }
    if (error instanceof AuthError) {
      return { error: "Adresse email ou mot de passe incorrect." };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Adresse email ou mot de passe incorrect." };
  }

  redirect(ROLE_DASHBOARD_PATH[user.role]);
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

// Logique commune à la demande initiale et au renvoi : ne révèle jamais si le compte existe
// (même réponse générique dans tous les cas — compte inexistant, cooldown actif, ou échec
// technique d'envoi), pour ne pas offrir un moyen d'énumérer les emails inscrits.
async function sendPasswordResetIfDue(email: string): Promise<AuthFormState> {
  const genericSuccess: AuthFormState = { success: true };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return genericSuccess;
  }

  const cooldownRemaining = await getSecondsUntilResendAllowed(user.id, "PASSWORD_RESET");
  if (cooldownRemaining > 0) {
    return genericSuccess;
  }

  const token = await createAuthToken(user.id, "PASSWORD_RESET");

  try {
    await sendPasswordResetEmail(user.email, user.name, token);
  } catch (error) {
    console.error("Échec de l'envoi de l'email de réinitialisation :", error);
  }

  return genericSuccess;
}

export async function requestPasswordResetAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!isValidEmail(email)) {
    return { error: "Cette adresse email ne semble pas valide." };
  }

  return sendPasswordResetIfDue(email);
}

// Renvoie le lien de réinitialisation depuis l'écran "Vérifiez votre boîte mail" — même
// email que celui déjà saisi dans le formulaire, appelé directement (pas de FormData).
export async function resendPasswordResetAction(email: string): Promise<AuthFormState> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    return { success: true };
  }

  return sendPasswordResetIfDue(normalizedEmail);
}

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!isValidPassword(password)) {
    return {
      error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    };
  }
  if (password !== confirmPassword) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const record = await consumeAuthToken(token, "PASSWORD_RESET");
  if (!record) {
    return { error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  redirect("/connexion?reset=1");
}
