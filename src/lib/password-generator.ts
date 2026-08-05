// src/lib/password-generator.ts
import { randomInt } from "node:crypto";

// Alphabet volontairement privé des caractères ambigus (0/O, 1/l/I) puisque ce mot de
// passe temporaire doit être recopié à la main depuis un email.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const TEMP_PASSWORD_LENGTH = 14;

// Génère un mot de passe temporaire via une source aléatoire cryptographiquement sûre
// (crypto.randomInt, pas Math.random) — utilisé pour les comptes créés directement par un
// établissement (voir src/lib/actions/jury-accounts.ts).
export function generateTemporaryPassword(): string {
  let password = "";
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    password += ALPHABET[randomInt(ALPHABET.length)];
  }
  return password;
}
