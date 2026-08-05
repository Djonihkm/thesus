// src/lib/student-theme.ts
import { prisma } from "@/lib/prisma";

export interface StudentCurrentTheme {
  id: string;
  title: string;
  category: string;
}

export interface PendingThemeSelection {
  id: string;
  theme: { id: string; title: string; category: string };
}

export interface AvailableTheme {
  id: string;
  title: string;
  category: string;
  description: string | null;
}

export interface StudentThemeContext {
  currentTheme: StudentCurrentTheme | null;
  pendingSelection: PendingThemeSelection | null;
  availableThemes: AvailableTheme[];
}

export async function getStudentThemeContext(
  userId: string,
  institutionId: string,
): Promise<StudentThemeContext> {
  const [student, pendingSelection, availableThemes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentTheme: { select: { id: true, title: true, category: true } },
      },
    }),
    prisma.themeSelection.findFirst({
      where: { studentId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, theme: { select: { id: true, title: true, category: true } } },
    }),
    // Un thème n'est "disponible" dans Parcourir que s'il est validé, pas déjà pris,
    // proposé par l'établissement (jamais par un autre étudiant — confidentialité), et
    // sans sélection PENDING en cours (évite qu'un thème disparaisse pour tout le monde
    // sauf le demandeur pendant que sa demande attend une décision).
    prisma.theme.findMany({
      where: {
        institutionId,
        status: "VALIDATED",
        takenByUserId: null,
        proposedByUserId: null,
        selections: { none: { status: "PENDING" } },
      },
      orderBy: { title: "asc" },
      select: { id: true, title: true, category: true, description: true },
    }),
  ]);

  return {
    currentTheme: student?.currentTheme ?? null,
    pendingSelection,
    availableThemes,
  };
}

export type ThemeRequestProposalStatus = "PROPOSED" | "VALIDATED" | "REJECTED";
export type ThemeRequestSelectionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface StudentThemeRequest {
  theme: { id: string; title: string; category: string; description: string | null };
  isOwnProposal: boolean;
  proposalStatus: ThemeRequestProposalStatus | null;
  selection: { id: string; status: ThemeRequestSelectionStatus } | null;
  isCurrent: boolean;
}

// Point de suivi unique pour "Mes demandes" : fusionne les thèmes proposés par
// l'étudiant (statut de la proposition) et les demandes de sélection qu'il a soumises
// (statut de la demande) — un même thème peut apparaître dans les deux (il a proposé son
// propre thème puis l'a demandé une fois validé), il ne doit alors être listé qu'une fois.
export async function getStudentThemeRequests(studentId: string): Promise<StudentThemeRequest[]> {
  const [proposedThemes, selections] = await Promise.all([
    prisma.theme.findMany({
      where: { proposedByUserId: studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        status: true,
        takenByUserId: true,
      },
    }),
    prisma.themeSelection.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        theme: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            takenByUserId: true,
          },
        },
      },
    }),
  ]);

  const byThemeId = new Map<string, StudentThemeRequest>();

  for (const theme of proposedThemes) {
    byThemeId.set(theme.id, {
      theme: {
        id: theme.id,
        title: theme.title,
        category: theme.category,
        description: theme.description,
      },
      isOwnProposal: true,
      proposalStatus: theme.status,
      selection: null,
      isCurrent: theme.takenByUserId === studentId,
    });
  }

  for (const selection of selections) {
    const existing = byThemeId.get(selection.theme.id);
    const selectionInfo = { id: selection.id, status: selection.status };
    if (existing) {
      existing.selection = selectionInfo;
    } else {
      byThemeId.set(selection.theme.id, {
        theme: {
          id: selection.theme.id,
          title: selection.theme.title,
          category: selection.theme.category,
          description: selection.theme.description,
        },
        isOwnProposal: false,
        proposalStatus: null,
        selection: selectionInfo,
        isCurrent: selection.theme.takenByUserId === studentId,
      });
    }
  }

  return Array.from(byThemeId.values());
}
