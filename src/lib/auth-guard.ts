import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_DASHBOARD_PATH, type Role } from "@/lib/validation";

export async function requireRole(role: Role) {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  if (session.user.role !== role) {
    redirect(ROLE_DASHBOARD_PATH[session.user.role]);
  }

  return session.user;
}
