import { prisma } from "@/lib/prisma";

export async function createNotification(userId: string, message: string, link?: string) {
  await prisma.notification.create({
    data: { userId, message, link: link ?? null },
  });
}

// Notifie tous les comptes établissement d'une institution (en pratique un seul aujourd'hui,
// voir le parcours d'inscription, mais rien n'empêche techniquement d'en avoir plusieurs).
export async function notifyInstitution(institutionId: string, message: string, link?: string) {
  const institutionUsers = await prisma.user.findMany({
    where: { institutionId, role: "INSTITUTION" },
    select: { id: true },
  });
  await Promise.all(institutionUsers.map((user) => createNotification(user.id, message, link)));
}
