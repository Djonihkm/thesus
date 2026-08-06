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
    return { error: "Le titre et la filière sont obligatoires." };
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
// validation par l'établissement. Ne devient PAS le thème courant de l'étudiant : une fois
// validé, ce thème doit encore faire l'objet d'une demande de sélection (requestThemeAction)
// comme n'importe quel autre thème — voir "Mes demandes" pour le suivi de la proposition.
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
    return { error: "Le titre et la filière sont obligatoires." };
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
      status: "PROPOSED",
      institutionId: user.institutionId,
      proposedByUserId: user.id,
    },
  });

  revalidateThemePaths();
  return { success: true };
}

// Étudiant : demande, en amont de tout dépôt, un thème déjà validé par l'établissement
// (établissement ou son propre thème proposé) — crée une demande PENDING plutôt que de lier
// immédiatement le thème à l'étudiant : l'établissement doit valider la pertinence du choix
// (voir approveThemeSelectionAction). Un thème déjà pris, ou déjà sous demande PENDING d'un
// autre étudiant, ne peut pas être redemandé ; un étudiant ne peut avoir qu'une seule
// demande PENDING à la fois.
export async function requestThemeAction(themeId: string): Promise<ThemeActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.institutionId) {
    return { error: "Établissement introuvable." };
  }
  // Un étudiant avec un thème actif doit d'abord le clôturer (voir
  // requestThemeClosureAction) avant d'en demander un autre — sans ce garde-fou, une
  // approbation ultérieure écraserait User.currentThemeId sans jamais libérer
  // Theme.takenByUserId de l'ancien thème, qui resterait verrouillé indéfiniment sans que
  // personne (y compris l'étudiant) ne le sache.
  if (user.currentThemeId) {
    return {
      error: "Vous avez déjà un thème actif — clôturez-le avant d'en demander un nouveau.",
    };
  }

  const theme = await prisma.theme.findUnique({ where: { id: themeId } });
  if (!theme || theme.institutionId !== user.institutionId || theme.status !== "VALIDATED") {
    return { error: "Thème introuvable ou non validé." };
  }
  // Un thème proposé par un autre étudiant ne doit jamais être atteignable, même par appel
  // direct de l'action (l'UI le cache déjà, mais ça ne suffit pas comme seule barrière) —
  // seul le proposant lui-même peut le demander une fois validé.
  if (theme.proposedByUserId && theme.proposedByUserId !== user.id) {
    return { error: "Ce thème n'est pas disponible." };
  }
  if (theme.takenByUserId) {
    return { error: "Ce thème est déjà pris par un autre étudiant." };
  }

  const [themePending, myPending] = await Promise.all([
    prisma.themeSelection.findFirst({ where: { themeId, status: "PENDING" } }),
    prisma.themeSelection.findFirst({ where: { studentId: user.id, status: "PENDING" } }),
  ]);
  if (themePending) {
    return { error: "Ce thème fait déjà l'objet d'une demande en attente de validation." };
  }
  if (myPending) {
    return { error: "Vous avez déjà une demande de thème en attente de validation." };
  }

  await prisma.themeSelection.create({
    data: { themeId, studentId: user.id, status: "PENDING" },
  });

  revalidateThemePaths();
  return { success: true };
}

async function requireInstitutionSelection(selectionId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTITUTION") {
    return { error: "Vous devez être connecté en tant qu'établissement." } as const;
  }

  const [user, selection] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.themeSelection.findUnique({ where: { id: selectionId }, include: { theme: true } }),
  ]);

  if (!user?.institutionId || !selection || selection.theme.institutionId !== user.institutionId) {
    return { error: "Demande introuvable." } as const;
  }
  if (selection.status !== "PENDING") {
    return { error: "Cette demande a déjà été traitée." } as const;
  }

  return { selection } as const;
}

// Établissement : approuve une demande de sélection — verrouille le thème sur l'étudiant
// (Theme.takenByUserId) et met à jour son thème courant (User.currentThemeId). Revérifie
// que le thème n'a pas été pris entretemps (garde-fou contre une double approbation
// concurrente sur deux demandes différentes du même thème — ne devrait normalement pas
// arriver puisque requestThemeAction bloque déjà les demandes concurrentes, mais coûte peu
// à vérifier ici aussi).
export async function approveThemeSelectionAction(selectionId: string): Promise<ThemeActionState> {
  const result = await requireInstitutionSelection(selectionId);
  if ("error" in result) return { error: result.error };
  const { selection } = result;

  if (selection.theme.takenByUserId) {
    return { error: "Ce thème est déjà pris par un autre étudiant." };
  }

  await prisma.$transaction([
    prisma.themeSelection.update({ where: { id: selectionId }, data: { status: "APPROVED" } }),
    prisma.theme.update({ where: { id: selection.themeId }, data: { takenByUserId: selection.studentId } }),
    prisma.user.update({ where: { id: selection.studentId }, data: { currentThemeId: selection.themeId } }),
  ]);

  revalidateThemePaths();
  return { success: true };
}

export async function rejectThemeSelectionAction(selectionId: string): Promise<ThemeActionState> {
  const result = await requireInstitutionSelection(selectionId);
  if ("error" in result) return { error: result.error };

  await prisma.themeSelection.update({ where: { id: selectionId }, data: { status: "REJECTED" } });
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

// Établissement : modifie un thème existant (titre, description, filière) — y compris un
// thème proposé par un étudiant (pour corriger une coquille par exemple) : l'origine
// (proposedByUserId) n'est jamais touchée ici, seul le contenu affiché change.
export async function updateThemeAction(
  themeId: string,
  input: { title: string; description?: string; category: string },
): Promise<ThemeActionState> {
  const result = await requireInstitutionTheme(themeId);
  if ("error" in result) return { error: result.error };

  const title = input.title.trim();
  const category = input.category.trim();
  if (!title || !category) {
    return { error: "Le titre et la filière sont obligatoires." };
  }

  await prisma.theme.update({
    where: { id: themeId },
    data: { title, category, description: input.description?.trim() || null },
  });

  revalidateThemePaths();
  return { success: true };
}

// Établissement : supprime un thème. Bloqué s'il est actuellement pris par un étudiant
// (Theme.takenByUserId) — le supprimer romprait silencieusement son parcours (thème
// affiché nulle part, plus de contexte sur ce qu'il a choisi) sans qu'aucune UI n'existe
// pour "libérer" un étudiant proprement ; l'établissement doit d'abord traiter ce cas
// autrement (aucune action de retrait existant à ce jour). Bloqué aussi si le thème est
// déjà référencé par un mémoire déposé, pour la même raison — perdre le thème d'un mémoire
// existant serait pire que de refuser la suppression. Si aucun de ces cas ne s'applique, les
// éventuelles ThemeSelection historiques (PENDING/REJECTED) sont nettoyées avant la
// suppression pour satisfaire la contrainte de clé étrangère (pas de cascade sur
// ThemeSelection.theme).
export async function deleteThemeAction(themeId: string): Promise<ThemeActionState> {
  const result = await requireInstitutionTheme(themeId);
  if ("error" in result) return { error: result.error };
  const { theme } = result;

  if (theme.takenByUserId) {
    const takenBy = await prisma.user.findUnique({
      where: { id: theme.takenByUserId },
      select: { name: true },
    });
    return {
      error: `Ce thème est actuellement pris par ${takenBy?.name ?? "un étudiant"} — impossible de le supprimer.`,
    };
  }

  const memoiresCount = await prisma.memoire.count({ where: { themeId } });
  if (memoiresCount > 0) {
    return {
      error: `Ce thème est déjà associé à ${memoiresCount} mémoire${memoiresCount > 1 ? "s" : ""} déposé${memoiresCount > 1 ? "s" : ""} — impossible de le supprimer.`,
    };
  }

  await prisma.$transaction([
    prisma.themeSelection.deleteMany({ where: { themeId } }),
    prisma.theme.delete({ where: { id: themeId } }),
  ]);

  revalidateThemePaths();
  return { success: true };
}

// Étudiant : demande la clôture de son thème actif — terminé/soutenu (aboutissement normal,
// le thème reste indisponible pour toujours) ou abandon (le thème redeviendra disponible et
// l'étudiant pourra en redemander un). Soumise à validation établissement, comme le reste du
// système de thèmes : crée une demande PENDING, le thème reste actif/utilisable (l'étudiant
// peut continuer à déposer sous ce thème) tant qu'elle n'est pas traitée.
export async function requestThemeClosureAction(
  themeId: string,
  reason: "COMPLETED" | "ABANDONED",
): Promise<ThemeActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.currentThemeId !== themeId) {
    return { error: "Ce thème n'est pas votre thème actif." };
  }

  const existingPending = await prisma.themeClosureRequest.findFirst({
    where: { themeId, studentId: user.id, status: "PENDING" },
  });
  if (existingPending) {
    return { error: "Une demande de clôture pour ce thème est déjà en attente de validation." };
  }

  await prisma.themeClosureRequest.create({
    data: { themeId, studentId: user.id, reason },
  });

  revalidateThemePaths();
  return { success: true };
}

async function requireInstitutionClosure(closureId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTITUTION") {
    return { error: "Vous devez être connecté en tant qu'établissement." } as const;
  }

  const [user, closure] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.themeClosureRequest.findUnique({ where: { id: closureId }, include: { theme: true } }),
  ]);

  if (!user?.institutionId || !closure || closure.theme.institutionId !== user.institutionId) {
    return { error: "Demande introuvable." } as const;
  }
  if (closure.status !== "PENDING") {
    return { error: "Cette demande a déjà été traitée." } as const;
  }

  return { closure } as const;
}

// Établissement : approuve une clôture de thème.
// - COMPLETED : Theme.takenByUserId reste inchangé — le thème est indisponible pour
//   toujours, aboutissement normal.
// - ABANDONED : Theme.takenByUserId repasse à null — le thème redevient disponible pour
//   tout le monde.
// Dans les deux cas, User.currentThemeId de l'étudiant repasse à null (il n'a plus de
// thème actif, et pourra en redemander un — condition déjà vérifiée par le garde-fou de
// requestThemeAction). Ne touche JAMAIS Memoire.themeId ni MemoireAssignment : les mémoires
// déjà déposés sous ce thème gardent leur lien et leur éventuelle assignation jury intacts —
// seule l'exclusivité du thème et le statut actif de l'étudiant changent.
export async function approveThemeClosureAction(closureId: string): Promise<ThemeActionState> {
  const result = await requireInstitutionClosure(closureId);
  if ("error" in result) return { error: result.error };
  const { closure } = result;

  if (closure.theme.takenByUserId !== closure.studentId) {
    return { error: "Ce thème n'est plus rattaché à cet étudiant." };
  }

  await prisma.$transaction([
    prisma.themeClosureRequest.update({ where: { id: closureId }, data: { status: "APPROVED" } }),
    prisma.theme.update({
      where: { id: closure.themeId },
      data: closure.reason === "ABANDONED" ? { takenByUserId: null } : {},
    }),
    prisma.user.update({ where: { id: closure.studentId }, data: { currentThemeId: null } }),
  ]);

  revalidateThemePaths();
  return { success: true };
}

export async function rejectThemeClosureAction(closureId: string): Promise<ThemeActionState> {
  const result = await requireInstitutionClosure(closureId);
  if ("error" in result) return { error: result.error };

  await prisma.themeClosureRequest.update({ where: { id: closureId }, data: { status: "REJECTED" } });
  revalidateThemePaths();
  return { success: true };
}
