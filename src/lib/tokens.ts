import { randomBytes } from "crypto";
import type { AuthTokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 1000 * 60 * 60 * 24, // 24h
  PASSWORD_RESET: 1000 * 60 * 30, // 30 min
};

// Délai minimal entre deux renvois d'email (vérification ou réinitialisation) — garde-fou
// serveur en plus du minuteur côté client, pour éviter le spam si l'action de renvoi est
// appelée directement en boucle.
export const RESEND_COOLDOWN_SECONDS = 60;
const RESEND_COOLDOWN_MS = RESEND_COOLDOWN_SECONDS * 1000;

export async function createAuthToken(userId: string, type: AuthTokenType): Promise<string> {
  await prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } });

  const token = randomBytes(32).toString("hex");

  await prisma.authToken.create({
    data: {
      token,
      type,
      userId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
    },
  });

  return token;
}

export async function consumeAuthToken(token: string, type: AuthTokenType) {
  const record = await prisma.authToken.findUnique({ where: { token } });

  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.authToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
}

// Nombre de secondes à attendre avant un nouvel envoi (0 si aucun cooldown actif).
// createAuthToken supprime le token existant non consommé au moment d'en créer un nouveau —
// c'est donc AVANT cet appel qu'il faut lire son âge pour savoir depuis quand le dernier
// envoi a eu lieu.
export async function getSecondsUntilResendAllowed(
  userId: string,
  type: AuthTokenType,
): Promise<number> {
  const latest = await prisma.authToken.findFirst({
    where: { userId, type, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return 0;

  const elapsedMs = Date.now() - latest.createdAt.getTime();
  const remainingMs = RESEND_COOLDOWN_MS - elapsedMs;
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const record = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  if (!record) return false;

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  return true;
}
