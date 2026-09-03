import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  isValidUrl,
  isRole,
  isStudyLevel,
  isJuryFunction,
  PASSWORD_MIN_LENGTH,
} from "./validation";

describe("isValidEmail", () => {
  it("accepts a well-formed email", () => {
    expect(isValidEmail("etudiant@universite.edu")).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidEmail("  etudiant@universite.edu  ")).toBe(true);
  });

  it.each(["", "not-an-email", "missing-domain@", "@missing-local.com", "no spaces@allowed.com"])(
    "rejects %s",
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    },
  );
});

describe("isValidPassword", () => {
  it(`rejects a password shorter than ${PASSWORD_MIN_LENGTH} characters`, () => {
    expect(isValidPassword("a".repeat(PASSWORD_MIN_LENGTH - 1))).toBe(false);
  });

  it(`accepts a password exactly ${PASSWORD_MIN_LENGTH} characters long`, () => {
    expect(isValidPassword("a".repeat(PASSWORD_MIN_LENGTH))).toBe(true);
  });
});

describe("isValidUrl", () => {
  it("accepts a URL with an explicit scheme", () => {
    expect(isValidUrl("https://exemple.edu")).toBe(true);
  });

  it("accepts a bare domain (defaults to https://)", () => {
    expect(isValidUrl("exemple.edu")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidUrl("")).toBe(false);
  });

  it("rejects a string that can never resolve to a hostname", () => {
    expect(isValidUrl("://")).toBe(false);
  });
});

describe("isRole", () => {
  it.each(["STUDENT", "JURY", "INSTITUTION"])("accepts %s", (role) => {
    expect(isRole(role)).toBe(true);
  });

  it.each([undefined, null, "", "ADMIN", "student"])("rejects %s", (value) => {
    expect(isRole(value)).toBe(false);
  });
});

describe("isStudyLevel", () => {
  it.each(["LICENCE", "MASTER", "DOCTORAT"])("accepts %s", (level) => {
    expect(isStudyLevel(level)).toBe(true);
  });

  it("rejects an unknown value", () => {
    expect(isStudyLevel("BACCALAUREAT")).toBe(false);
  });
});

describe("isJuryFunction", () => {
  it.each(["ENSEIGNANT", "PROFESSIONNEL"])("accepts %s", (value) => {
    expect(isJuryFunction(value)).toBe(true);
  });

  it("rejects an unknown value", () => {
    expect(isJuryFunction("ETUDIANT")).toBe(false);
  });
});
