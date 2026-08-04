// src/lib/student-theme.ts
import { prisma } from "@/lib/prisma";

export interface StudentCurrentTheme {
  id: string;
  title: string;
  category: string;
  status: "PROPOSED" | "VALIDATED" | "REJECTED";
}

export interface AvailableTheme {
  id: string;
  title: string;
  category: string;
  description: string | null;
}

export interface StudentThemeContext {
  currentTheme: StudentCurrentTheme | null;
  availableThemes: AvailableTheme[];
}

export async function getStudentThemeContext(
  userId: string,
  institutionId: string,
): Promise<StudentThemeContext> {
  const [student, availableThemes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentTheme: { select: { id: true, title: true, category: true, status: true } },
      },
    }),
    prisma.theme.findMany({
      where: { institutionId, status: "VALIDATED" },
      orderBy: { title: "asc" },
      select: { id: true, title: true, category: true, description: true },
    }),
  ]);

  return { currentTheme: student?.currentTheme ?? null, availableThemes };
}
