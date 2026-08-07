"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface SearchResult {
  id: string;
  type: "memoire" | "theme";
  title: string;
  subtitle: string;
  href: string;
}

const MAX_RESULTS_PER_TYPE = 5;
const MIN_QUERY_LENGTH = 2;

// Recherche texte simple sur le titre (mémoire ou thème), scopée selon le rôle de
// l'utilisateur connecté — jamais selon un paramètre fourni par le client. Pas de
// full-text/pertinence pour cette itération, juste un "contains" insensible à la casse.
export async function searchDashboardAction(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const session = await auth();
  if (!session?.user) {
    return [];
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, institutionId: true },
  });
  if (!user) {
    return [];
  }

  const titleMatch = { contains: trimmed, mode: "insensitive" as const };

  if (user.role === "STUDENT") {
    const [memoires, themes] = await Promise.all([
      prisma.memoire.findMany({
        where: { studentId: session.user.id, title: titleMatch },
        orderBy: { submittedAt: "desc" },
        take: MAX_RESULTS_PER_TYPE,
        select: { id: true, title: true },
      }),
      user.institutionId
        ? prisma.theme.findMany({
            where: {
              institutionId: user.institutionId,
              title: titleMatch,
              // Mêmes thèmes que "Parcourir les thèmes" (disponibles) + ceux que
              // l'étudiant a lui-même proposés ou tient déjà — jamais les propositions
              // d'un autre étudiant (confidentialité, voir getStudentThemeContext).
              OR: [
                {
                  status: "VALIDATED",
                  takenByUserId: null,
                  proposedByUserId: null,
                  selections: { none: { status: "PENDING" } },
                },
                { proposedByUserId: session.user.id },
                { takenByUserId: session.user.id },
              ],
            },
            orderBy: { title: "asc" },
            take: MAX_RESULTS_PER_TYPE,
            select: { id: true, title: true, category: true },
          })
        : Promise.resolve([]),
    ]);

    return [
      ...memoires.map(
        (memoire): SearchResult => ({
          id: memoire.id,
          type: "memoire",
          title: memoire.title,
          subtitle: "Mémoire",
          href: `/dashboard/etudiant/memoires/${memoire.id}`,
        }),
      ),
      ...themes.map(
        (theme): SearchResult => ({
          id: theme.id,
          type: "theme",
          title: theme.title,
          subtitle: theme.category,
          href: `/dashboard/etudiant/themes`,
        }),
      ),
    ];
  }

  if (user.role === "JURY") {
    const memoires = await prisma.memoire.findMany({
      where: {
        title: titleMatch,
        status: "COMPLETED",
        OR: [
          { assignments: { some: { juryId: session.user.id, status: "VALIDATED" } } },
          { evaluations: { some: { juryId: session.user.id } } },
        ],
      },
      orderBy: { submittedAt: "desc" },
      take: MAX_RESULTS_PER_TYPE,
      include: { student: { select: { name: true } } },
    });

    return memoires.map(
      (memoire): SearchResult => ({
        id: memoire.id,
        type: "memoire",
        title: memoire.title,
        subtitle: memoire.student.name,
        href: `/dashboard/jury/memoires/${memoire.id}`,
      }),
    );
  }

  // INSTITUTION
  if (!user.institutionId) {
    return [];
  }

  const [memoires, themes] = await Promise.all([
    prisma.memoire.findMany({
      where: { institutionId: user.institutionId, title: titleMatch },
      orderBy: { submittedAt: "desc" },
      take: MAX_RESULTS_PER_TYPE,
      include: { student: { select: { name: true } } },
    }),
    prisma.theme.findMany({
      where: { institutionId: user.institutionId, title: titleMatch },
      orderBy: { title: "asc" },
      take: MAX_RESULTS_PER_TYPE,
      select: { id: true, title: true, category: true },
    }),
  ]);

  return [
    ...memoires.map(
      (memoire): SearchResult => ({
        id: memoire.id,
        type: "memoire",
        title: memoire.title,
        subtitle: memoire.student.name,
        // Pas de page de détail dédiée côté établissement — la bibliothèque
        // (liste complète) est la page "correspondante" pour ce rôle.
        href: `/dashboard/etablissement/memoires`,
      }),
    ),
    ...themes.map(
      (theme): SearchResult => ({
        id: theme.id,
        type: "theme",
        title: theme.title,
        subtitle: theme.category,
        href: `/dashboard/etablissement/themes`,
      }),
    ),
  ];
}
