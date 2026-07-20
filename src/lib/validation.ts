const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

export type Role = "STUDENT" | "JURY" | "INSTITUTION";

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Étudiant",
  JURY: "Jury",
  INSTITUTION: "Établissement",
};

export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  STUDENT: "/dashboard/etudiant",
  JURY: "/dashboard/jury",
  INSTITUTION: "/dashboard/etablissement",
};

export function isRole(value: unknown): value is Role {
  return value === "STUDENT" || value === "JURY" || value === "INSTITUTION";
}

export type StudyLevel = "LICENCE" | "MASTER" | "DOCTORAT";

export const STUDY_LEVEL_LABELS: Record<StudyLevel, string> = {
  LICENCE: "Licence",
  MASTER: "Master",
  DOCTORAT: "Doctorat",
};

export function isStudyLevel(value: unknown): value is StudyLevel {
  return value === "LICENCE" || value === "MASTER" || value === "DOCTORAT";
}

export type JuryFunction = "ENSEIGNANT" | "PROFESSIONNEL";

export const JURY_FUNCTION_LABELS: Record<JuryFunction, string> = {
  ENSEIGNANT: "Enseignant",
  PROFESSIONNEL: "Professionnel du secteur",
};

export function isJuryFunction(value: unknown): value is JuryFunction {
  return value === "ENSEIGNANT" || value === "PROFESSIONNEL";
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}
