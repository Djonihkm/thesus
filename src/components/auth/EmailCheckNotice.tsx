"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import { FormError } from "@/components/auth/FormError";

// Doit rester égal à RESEND_COOLDOWN_SECONDS (src/lib/tokens.ts) — pas importable ici : ce
// module server-only tire sur Prisma/crypto, incompatible avec un composant client. Le
// serveur reste la source de vérité (voir getSecondsUntilResendAllowed) ; cette valeur ne
// sert qu'à afficher le bon décompte initial côté client.
const RESEND_COOLDOWN_SECONDS = 60;

interface EmailCheckNoticeProps {
  description: ReactNode;
  email: string;
  resendAction: (email: string) => Promise<{ error?: string; success?: boolean }>;
}

// Écran "Vérifiez votre boîte mail" partagé par l'inscription et le mot de passe oublié —
// mention spam mise en avant (pas juste une phrase perdue dans le texte) et bouton de renvoi
// avec cooldown côté client, cohérents entre les deux flows plutôt que deux implémentations
// distinctes.
export function EmailCheckNotice({ description, email, resendAction }: EmailCheckNoticeProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    setIsPending(true);
    setError(null);
    setConfirmed(false);
    const result = await resendAction(email);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirmed(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <p className="text-lg font-medium text-ink">Vérifiez votre boîte mail</p>
      <p className="leading-relaxed text-ink-muted">{description}</p>

      <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-left">
        <MailWarning size={18} className="mt-0.5 shrink-0 text-accent-dark" />
        <p className="text-sm leading-relaxed text-ink">
          Vous ne voyez rien après quelques minutes ? Vérifiez votre dossier{" "}
          <strong>spam / courrier indésirable</strong>.
        </p>
      </div>

      {error ? <FormError message={error} /> : null}
      {confirmed ? <p className="text-sm font-medium text-accent-dark">Email renvoyé.</p> : null}

      <button
        type="button"
        onClick={handleResend}
        disabled={isPending || cooldown > 0}
        className="self-center rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-neutral disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Envoi…"
          : cooldown > 0
            ? `Renvoyer l'email (${cooldown}s)`
            : "Renvoyer l'email"}
      </button>

      <Link href="/connexion" className="text-sm text-ink underline underline-offset-4">
        Retour à la connexion
      </Link>
    </div>
  );
}
