import nodemailer from "nodemailer";

// Solution temporaire pour la phase de dev/test : envoi via un compte Gmail personnel
// en SMTP. Gmail limite fortement le volume et la délivrabilité (spam probable en
// production) — à remplacer par un service transactionnel (Resend ou équivalent) avec
// domaine vérifié avant tout lancement public.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    // Google affiche le mot de passe d'application en 4 groupes séparés par des
    // espaces ; ces espaces ne font pas partie de la valeur réelle attendue par le SMTP.
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ""),
  },
});

const FROM = `Thesus <${process.env.GMAIL_USER}>`;

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function emailShell(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #F5F5F3; padding: 40px 0;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; padding: 32px; border: 1px solid #eaeaea;">
        <p style="font-size: 13px; letter-spacing: 0.02em; color: #D4A857; font-weight: 600; margin: 0 0 16px;">Thesus</p>
        <h1 style="font-size: 20px; font-weight: 500; color: #0A0A0A; margin: 0 0 16px;">${title}</h1>
        <div style="font-size: 14px; line-height: 1.6; color: #6B6B6B; margin-bottom: 24px;">${bodyHtml}</div>
        <a href="${ctaUrl}" style="display: inline-block; background-color: #0A0A0A; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-size: 14px; font-weight: 500;">${ctaLabel}</a>
        <p style="font-size: 12px; color: #8A8A8A; margin-top: 24px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : ${ctaUrl}</p>
      </div>
    </div>
  `;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${getAppUrl()}/verifier-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Confirmez votre adresse email — Thesus",
    html: emailShell(
      "Bienvenue sur Thesus",
      `<p>Bonjour ${name},</p><p>Confirmez votre adresse email pour activer votre compte et accéder à votre espace.</p><p>Ce lien expire dans 24 heures.</p>`,
      "Confirmer mon email",
      url,
    ),
    text: `Bonjour ${name}, confirmez votre adresse email pour activer votre compte : ${url} (lien valable 24 heures)`,
  });
}

export async function sendJuryAccountCreatedEmail(
  to: string,
  name: string,
  temporaryPassword: string,
) {
  const url = `${getAppUrl()}/connexion`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Votre compte jury Thesus a été créé",
    html: emailShell(
      "Votre compte jury est prêt",
      `<p>Bonjour ${name},</p><p>Votre établissement vient de créer votre compte jury sur Thesus. Voici vos identifiants de connexion :</p><p style="margin: 16px 0; padding: 12px 16px; background-color: #F5F5F3; border-radius: 8px;"><strong>Email :</strong> ${to}<br /><strong>Mot de passe temporaire :</strong> ${temporaryPassword}</p><p>Pour votre sécurité, il vous sera demandé de choisir un nouveau mot de passe dès votre première connexion.</p>`,
      "Se connecter",
      url,
    ),
    text: `Bonjour ${name}, votre compte jury Thesus a été créé. Email : ${to} — Mot de passe temporaire : ${temporaryPassword}. Connectez-vous sur ${url} ; un changement de mot de passe vous sera demandé dès la première connexion.`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${getAppUrl()}/reinitialiser-mot-de-passe?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Réinitialisez votre mot de passe — Thesus",
    html: emailShell(
      "Réinitialisation de mot de passe",
      `<p>Bonjour ${name},</p><p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte. Si vous êtes à l'origine de cette demande, choisissez un nouveau mot de passe via le lien ci-dessous.</p><p>Ce lien expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
      "Choisir un nouveau mot de passe",
      url,
    ),
    text: `Bonjour ${name}, réinitialisez votre mot de passe via ce lien : ${url} (lien valable 30 minutes)`,
  });
}
