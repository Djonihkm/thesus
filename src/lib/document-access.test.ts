import { describe, it, expect } from "vitest";
import type { User, Memoire } from "@prisma/client";
import { canAccessMemoireDocument } from "./document-access";

// Fonction pure au coeur de l'autorisation d'accès au document collaboratif (Y-Sweet, images,
// vue éditeur) — la fonction la plus sensible à une régression silencieuse (IDOR) signalée
// par l'audit sécurité. Objets partiels castés en User/Memoire : seuls les champs lus par la
// fonction (id, role, institutionId, studentId, status) importent ici.
function buildUser(overrides: Partial<User>): User {
  return { id: "user-1", role: "STUDENT", institutionId: "inst-1", ...overrides } as User;
}

function buildMemoire(overrides: Partial<Memoire>): Memoire {
  return {
    id: "memoire-1",
    studentId: "student-1",
    institutionId: "inst-1",
    status: "COMPLETED",
    ...overrides,
  } as Memoire;
}

describe("canAccessMemoireDocument", () => {
  it("allows the owning student", () => {
    const user = buildUser({ id: "student-1", role: "STUDENT" });
    const memoire = buildMemoire({ studentId: "student-1" });
    expect(canAccessMemoireDocument(user, memoire)).toBe(true);
  });

  it("denies a student who does not own the memoire", () => {
    const user = buildUser({ id: "student-2", role: "STUDENT" });
    const memoire = buildMemoire({ studentId: "student-1" });
    expect(canAccessMemoireDocument(user, memoire)).toBe(false);
  });

  it("allows a jury from the same institution when the memoire is COMPLETED", () => {
    const user = buildUser({ id: "jury-1", role: "JURY", institutionId: "inst-1" });
    const memoire = buildMemoire({ institutionId: "inst-1", status: "COMPLETED" });
    expect(canAccessMemoireDocument(user, memoire)).toBe(true);
  });

  it("denies a jury from a different institution", () => {
    const user = buildUser({ id: "jury-1", role: "JURY", institutionId: "inst-2" });
    const memoire = buildMemoire({ institutionId: "inst-1", status: "COMPLETED" });
    expect(canAccessMemoireDocument(user, memoire)).toBe(false);
  });

  it("denies a jury when the memoire is not yet COMPLETED", () => {
    const user = buildUser({ id: "jury-1", role: "JURY", institutionId: "inst-1" });
    const memoire = buildMemoire({ institutionId: "inst-1", status: "PROCESSING" });
    expect(canAccessMemoireDocument(user, memoire)).toBe(false);
  });

  it("denies a jury with no institution", () => {
    const user = buildUser({ id: "jury-1", role: "JURY", institutionId: null });
    const memoire = buildMemoire({ institutionId: "inst-1", status: "COMPLETED" });
    expect(canAccessMemoireDocument(user, memoire)).toBe(false);
  });

  it("denies an institution account (not the owner, not a jury)", () => {
    const user = buildUser({ id: "inst-user-1", role: "INSTITUTION", institutionId: "inst-1" });
    const memoire = buildMemoire({ institutionId: "inst-1", status: "COMPLETED" });
    expect(canAccessMemoireDocument(user, memoire)).toBe(false);
  });
});
