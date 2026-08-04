// src/lib/jury-workload.ts
//
// Charge de travail par jury (mémoires actuellement assignés) — MemoireAssignment est un
// historique append-only (voir schema.prisma), donc l'assignation "active" d'un mémoire
// est sa ligne la plus récente ; on ne compte que celles encore VALIDATED.
import type { MemoireStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AssignedMemoire {
  id: string;
  title: string;
  status: MemoireStatus;
  submittedAt: Date;
  studentName: string;
}

export async function getInstitutionJuryWorkload(
  institutionId: string,
): Promise<Map<string, AssignedMemoire[]>> {
  const memoires = await prisma.memoire.findMany({
    where: { institutionId },
    select: {
      id: true,
      title: true,
      status: true,
      submittedAt: true,
      student: { select: { name: true } },
      assignments: {
        orderBy: { assignedAt: "desc" },
        take: 1,
        select: { juryId: true, status: true },
      },
    },
  });

  const byJury = new Map<string, AssignedMemoire[]>();
  for (const memoire of memoires) {
    const current = memoire.assignments[0];
    if (current?.status !== "VALIDATED") continue;

    const list = byJury.get(current.juryId) ?? [];
    list.push({
      id: memoire.id,
      title: memoire.title,
      status: memoire.status,
      submittedAt: memoire.submittedAt,
      studentName: memoire.student.name,
    });
    byJury.set(current.juryId, list);
  }

  return byJury;
}
