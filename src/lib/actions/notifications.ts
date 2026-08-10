"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type NotificationActionState = {
  error?: string;
  success?: boolean;
};

export async function markNotificationReadAction(id: string): Promise<NotificationActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Vous devez être connecté." };
  }

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== session.user.id) {
    return { error: "Notification introuvable." };
  }

  if (!notification.readAt) {
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Vous devez être connecté." };
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return { success: true };
}
