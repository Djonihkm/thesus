"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ThemeActionState = {
  error?: string;
  success?: boolean;
};

// Toutes les pages qui affichent des données de thème (liste établissement, liste/statut
// étudiant) — ce sont des routes dynamiques (pas de Full Route Cache), donc le seul cache
// à invalider est le Router Cache côté client : sans ça, la page qui a déclenché l'action
// reste affichée avec ses données obsolètes tant qu'elle n'est pas rechargée manuellement.
function revalidateThemePaths() {
  revalidatePath("/dashboard/etablissement/themes");
  revalidatePath("/dashboard/etablissement");
  revalidatePath("/dashboard/etudiant/themes");
  revalidatePath("/dashboard/etudiant");
  revalidatePath("/dashboard/etudiant/memoires");
}

// Établissement : crée directement un thème validé, à proposer aux étudiants.
export async function createThemeAction(input: {
  title: string;
  description?: string;
  category: string;
}): Promise<ThemeActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTITUTION") {
    return { error: "Vous devez être connecté en tant qu'établissement." };
  }

  const title = input.title.trim();
  const category = input.category.trim();
  if (!title || !category) {
    return { error: "Le titre et la catégorie sont obligatoires." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.institutionId) {
    return { error: "Établissement introuvable." };
  }

  await prisma.theme.create({
    data: {
      title,
      description: input.description?.trim() || null,
      category,
      status: "VALIDATED",
      institutionId: user.institutionId,
    },
  });

  revalidateThemePaths();
  return { success: true };
}

// Étudiant : propose un nouveau thème, en amont de tout dépôt — passe en attente de
// validation par l'établissement. Devient le thème "courant" de l'étudiant (User.currentThemeId)
// dès la proposition, pour qu'il voie où il en est plutôt qu'un vide silencieux ; le dépôt
// de mémoire reste bloqué tant que ce thème n'est pas VALIDATED (voir createMemoireAction).
export async function proposeThemeAction(input: {
  title: string;
  description?: string;
  category: string;
}): Promise<ThemeActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const title = input.title.trim();
  const category = input.category.trim();
  if (!title || !category) {
    return { error: "Le titre et la catégorie sont obligatoires." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.institutionId) {
    return { error: "Établissement introuvable." };
  }

  const theme = await prisma.theme.create({
    data: {
      title,
      description: input.description?.trim() || null,
      category,
      status: "PROPOSED",
      institutionId: user.institutionId,
      proposedByUserId: user.id,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { currentThemeId: theme.id },
  });

  revalidateThemePaths();
  return { success: true };
}

// Étudiant : choisit, en amont de tout dépôt, un thème déjà validé par l'établissement —
// devient immédiatement son thème courant (débloque le dépôt tout de suite, aucune
// validation supplémentaire n'est nécessaire puisque le thème l'est déjà).
export async function chooseThemeAction(themeId: string): Promise<ThemeActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.institutionId) {
    return { error: "Établissement introuvable." };
  }

  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  if (
    !theme ||
    theme.institutionId !== user.institutionId ||
    theme.status !== "VALIDATED"
  ) {
    return { error: "Thème introuvable ou non validé." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { currentThemeId: theme.id },
  });

  revalidateThemePaths();
  return { success: true };
}

async function requireInstitutionTheme(themeId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTITUTION") {
    return { error: "Vous devez être connecté en tant qu'établissement." } as const;
  }

  const [user, theme] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.theme.findUnique({ where: { id: themeId } }),
  ]);

  if (!user?.institutionId || !theme || theme.institutionId !== user.institutionId) {
    return { error: "Thème introuvable." } as const;
  }

  return { theme } as const;
}

export async function validateThemeAction(themeId: string): Promise<ThemeActionState> {
  const result = await requireInstitutionTheme(themeId);
  if ("error" in result) return { error: result.error };

  await prisma.theme.update({ where: { id: themeId }, data: { status: "VALIDATED" } });
  revalidateThemePaths();
  return { success: true };
}

export async function rejectThemeAction(themeId: string): Promise<ThemeActionState> {
  const result = await requireInstitutionTheme(themeId);
  if ("error" in result) return { error: result.error };

  await prisma.theme.update({ where: { id: themeId }, data: { status: "REJECTED" } });
  revalidateThemePaths();
  return { success: true };
}
