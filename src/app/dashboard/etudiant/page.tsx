// src/app/dashboard/etudiant/page.tsx
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { MemoireCard } from "@/components/dashboard/MemoireCard";
import { MemoireUploadForm } from "@/components/dashboard/MemoireUploadForm";
import { ThemeStatusBanner } from "@/components/dashboard/ThemeStatusBanner";
import { InstitutionStatusBanner } from "@/components/dashboard/InstitutionStatusBanner";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { Button } from "@/components/ui/Button";
import { AuditIcon, PlagiarismIcon, QuizIcon, JuryIcon } from "@/components/icons";
import { getStudentThemeContext } from "@/lib/student-theme";

const RECENT_MEMOIRES_LIMIT = 5;

export default async function EtudiantDashboardPage() {
  const user = await requireRole("STUDENT");

  const [memoires, themeContext] = await Promise.all([
    prisma.memoire.findMany({
      where: { studentId: user.id },
      orderBy: { submittedAt: "desc" },
      take: RECENT_MEMOIRES_LIMIT,
    }),
    user.institutionId
      ? getStudentThemeContext(user.id, user.institutionId)
      : Promise.resolve({
          currentTheme: null,
          pendingSelection: null,
          pendingClosure: null,
          availableThemes: [],
        }),
  ]);

  const hasProcessingMemoire = memoires.some(
    (memoire) => memoire.status === "PENDING" || memoire.status === "PROCESSING",
  );
  // Le take(5) ci-dessus ne fausse pas ce test : s'il existe au moins un mémoire, la
  // requête limitée en renvoie forcément au moins un.
  const hasAnyMemoire = memoires.length > 0;

  return (
    <>
      <AutoRefresh enabled={hasProcessingMemoire} />

      <DashboardHeader
        eyebrow="Espace étudiant"
        title={`Bonjour ${user.name}`}
        description="Déposez votre mémoire pour accéder immédiatement à l'audit, l'anti-plagiat, le quiz et la préparation au jury."
      />

      <div className="mt-12 flex flex-col gap-6">
        {user.affiliatedInstitutionName ? (
          <InstitutionStatusBanner affiliatedInstitutionName={user.affiliatedInstitutionName} />
        ) : null}
        <ThemeStatusBanner
          currentTheme={themeContext.currentTheme}
          pendingSelection={themeContext.pendingSelection}
          pendingClosure={themeContext.pendingClosure}
        />
      </div>

      <div className="mt-12">
        {!hasAnyMemoire ? (
          <MemoireUploadForm activeThemeTitle={themeContext.currentTheme?.title ?? null} />
        ) : (
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
                Mes derniers mémoires
              </h2>
              <Button
                href="/dashboard/etudiant/memoires"
                variant="outline"
                tone="light"
                className="text-sm"
              >
                Voir tous mes mémoires
              </Button>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {memoires.map((memoire) => (
                <MemoireCard
                  key={memoire.id}
                  id={memoire.id}
                  title={memoire.title}
                  status={memoire.status}
                  submittedAt={memoire.submittedAt}
                />
              ))}
            </div>
            <Button
              href="/dashboard/etudiant/memoires"
              tone="light"
              variant="outline"
              className="mt-4 text-sm"
            >
              Déposer un nouveau mémoire
            </Button>
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">
          Ce que vous pourrez faire une fois votre mémoire traité
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ActionCard
            icon={<AuditIcon className="h-5 w-5" />}
            title="Audit de mémoire"
            description="Analyse de structure, cohérence et qualité rédactionnelle."
            status="locked"
          />
          <ActionCard
            icon={<PlagiarismIcon className="h-5 w-5" />}
            title="Anti-plagiat"
            description="Comparaison à une base de publications et certificat officiel."
            status="locked"
          />
          <ActionCard
            icon={<QuizIcon className="h-5 w-5" />}
            title="Quiz personnalisé"
            description="Questions générées à partir du contenu de votre mémoire."
            status="locked"
          />
          <ActionCard
            icon={<JuryIcon className="h-5 w-5" />}
            title="Simulation de jury"
            description="Entraînez-vous avec des questions de soutenance ciblées."
            status="locked"
          />
        </div>
      </div>
    </>
  );
}
