import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_DASHBOARD_PATH, type Role } from "@/lib/validation";

export async function requireRole(role: Role) {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  if (session.user.role !== role) {
    redirect(ROLE_DASHBOARD_PATH[session.user.role]);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { institution: true },
  });

  if (!user) {
    redirect("/connexion");
  }

  // Comptes créés directement par un établissement (ex. jury avec mot de passe
  // temporaire, voir src/lib/actions/jury-accounts.ts) : aucun accès au dashboard tant
  // que le mot de passe temporaire n'a pas été changé.
  if (user.mustChangePassword) {
    redirect("/changer-mot-de-passe");
  }

  return user;
}