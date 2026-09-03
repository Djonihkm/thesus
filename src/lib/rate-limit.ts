// src/lib/rate-limit.ts
//
// Anti-bruteforce sur la connexion — table Postgres plutôt qu'en mémoire (voir
// LoginAttempt dans schema.prisma) : un Map en mémoire ne survivrait pas à un redémarrage
// de fonction serverless (Vercel) ni ne serait partagé entre instances, ce qui le rendrait
// inefficace en production. Compte par identifiant (email normalisé), pas par IP : plus
// simple, suffisant contre un bruteforce ciblé sur un compte précis (le cas qui compte le
// plus ici), une limite par IP viendrait s'ajouter plutôt que remplacer celle-ci si le
// besoin se confirme.
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export interface LoginRateLimitResult {
  allowed: boolean;
  retryAfterMinutes?: number;
}

export async function checkLoginRateLimit(identifier: string): Promise<LoginRateLimitResult> {
  const normalized = normalizeIdentifier(identifier);
  const windowStart = new Date(Date.now() - WINDOW_MS);

  // Nettoyage au passage plutôt qu'un job planifié séparé — hors de portée raisonnable pour
  // ce correctif, et cette table ne grossit que d'une ligne par tentative échouée.
  await prisma.loginAttempt.deleteMany({
    where: { identifier: normalized, createdAt: { lt: windowStart } },
  });

  const count = await prisma.loginAttempt.count({
    where: { identifier: normalized, createdAt: { gte: windowStart } },
  });

  if (count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMinutes: Math.ceil(WINDOW_MS / 60_000) };
  }
  return { allowed: true };
}

export async function recordFailedLoginAttempt(identifier: string): Promise<void> {
  await prisma.loginAttempt.create({ data: { identifier: normalizeIdentifier(identifier) } });
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { identifier: normalizeIdentifier(identifier) } });
}
