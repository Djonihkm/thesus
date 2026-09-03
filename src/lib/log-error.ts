// src/lib/log-error.ts
//
// Point d'intégration unique pour les erreurs applicatives — jusqu'ici, une quinzaine
// d'appels console.error épars dans autant de fichiers (audit et jury, paiements, emails,
// anti-plagiat, y-sweet...), sans aucun système d'agrégation ni d'alerte. Pas de Sentry/APM
// branché aujourd'hui (nécessiterait la création d'un compte externe + une clé DSN — même
// famille de dépendance externe que CORE_API_KEY ou STRIPE_SECRET_KEY, voir .env.example) :
// ces logs ne sont donc consultables aujourd'hui que dans les logs de fonction Vercel (ou la
// console locale en dev). Fonctionne aussi bien côté serveur que client (composants "use
// client" comme PdfViewer.tsx) — console existe dans les deux environnements.
//
// Pour brancher un vrai service d'alerte plus tard (Sentry, Axiom, etc.), c'est le SEUL
// endroit à modifier : ajouter l'appel au SDK ici, tous les points d'appel en profitent sans
// changement ailleurs.
export function logError(context: string, error: unknown, extra?: Record<string, unknown>): void {
  if (extra) {
    console.error(`[${context}]`, error, extra);
  } else {
    console.error(`[${context}]`, error);
  }
}
