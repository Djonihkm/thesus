import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  const role = session.user.role;

  if (role === "STUDENT") {
    redirect("/dashboard/etudiant");
  }

  if (role === "JURY") {
    redirect("/dashboard/jury");
  }

  if (role === "INSTITUTION") {
    redirect("/dashboard/etablissement");
  }

  redirect("/");
}
