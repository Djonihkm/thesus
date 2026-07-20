import { randomBytes } from "crypto";
import type { AuthTokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 1000 * 60 * 60 * 24, // 24h
  PASSWORD_RESET: 1000 * 60 * 30, // 30 min
};

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

export async function verifyEmailToken(token: string): Promise<boolean> {
  const record = await consumeAuthToken(token, "EMAIL_VERIFICATION");
  if (!record) return false;

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  return true;
}
