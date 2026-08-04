import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ThemeForm } from "@/components/dashboard/ThemeForm";
import { ThemeReviewRow } from "@/components/dashboard/ThemeReviewRow";

export default async function EtablissementThemesPage() {
  const user = await requireRole("INSTITUTION");

  if (!user.institutionId) {
    return (
      <DashboardHeader
        eyebrow="Thèmes"
        title="Bibliothèque de thèmes"
        description="Votre établissement n'est pas encore rattaché à la plateforme."
      />
    );
  }

  const institutionId = user.institutionId;

  const [validatedThemes, proposedThemes] = await Promise.all([
    prisma.theme.findMany({
      where: { institutionId, status: "VALIDATED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.theme.findMany({
      where: { institutionId, status: "PROPOSED" },
      orderBy: { createdAt: "asc" },
      include: { proposedBy: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <DashboardHeader
        eyebrow="Thèmes"
        title="Bibliothèque de thèmes"
        description="Proposez des thèmes de mémoire aux étudiants et validez leurs propositions."
      />

      {proposedThemes.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
            En attente de validation ({proposedThemes.length})
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {proposedThemes.map((theme) => (
              <ThemeReviewRow
                key={theme.id}
                themeId={theme.id}
                title={theme.title}
                category={theme.category}
                description={theme.description}
                proposedByName={theme.proposedBy?.name ?? "Étudiant"}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
            Thèmes disponibles ({validatedThemes.length})
          </h2>
          {validatedThemes.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              Aucun thème validé pour le moment — créez-en un pour que les étudiants puissent le choisir.
            </p>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {validatedThemes.map((theme) => (
                <div
                  key={theme.id}
                  className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-sm shadow-ink/5"
                >
                  <span className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
                    {theme.category}
                  </span>
                  <h3 className="mt-1 text-base font-medium text-ink">{theme.title}</h3>
                  {theme.description ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                      {theme.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border-neutral bg-surface-light p-6 shadow-sm shadow-ink/5">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Créer un thème</h2>
          <div className="mt-5">
            <ThemeForm />
          </div>
        </div>
      </div>
    </>
  );
}
