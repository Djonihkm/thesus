// src/components/dashboard/InstitutionStatusBanner.tsx
//
// Bloc purement informatif, jamais bloquant — même principe que ThemeStatusBanner. N'est
// affiché que lorsque l'étudiant a saisi un nom d'établissement à l'inscription qui ne
// correspondait à aucune Institution existante (affiliatedInstitutionName, voir
// resolveInstitutionSelection dans src/lib/actions/auth.ts) — un étudiant qui a laissé le
// champ vide (établissement désormais facultatif) n'a rien à rattacher et ne voit aucune
// bannière du tout, voir les pages appelantes (etudiant/page.tsx, etudiant/memoires/page.tsx).
export function InstitutionStatusBanner({
  affiliatedInstitutionName,
}: {
  affiliatedInstitutionName: string;
}) {
  return (
    <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-md shadow-ink/8">
      <p className="text-sm font-medium text-ink">Compte non rattaché à un établissement</p>
      <p className="mt-1 text-xs text-ink-muted">
        Vous pouvez rédiger, déposer et travailler votre mémoire librement : éditeur, audit,
        anti-plagiat, quiz et simulation de jury restent disponibles. Nous avons bien noté «{" "}
        {affiliatedInstitutionName} » : notre équipe pourra rattacher votre compte une fois
        votre établissement intégré à la plateforme.
      </p>
    </div>
  );
}
