"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { JuryQuestionCategory } from "@prisma/client";

interface JuryQuestionItem {
  id: string;
  category: JuryQuestionCategory;
  question: string;
  order: number;
}

interface JuryQuestionListProps {
  memoireId: string;
  questions: JuryQuestionItem[];
}

const CATEGORY_LABELS: Record<JuryQuestionCategory, string> = {
  METHODOLOGIE: "Méthodologie",
  RESULTATS: "Résultats",
  REVUE_LITTERATURE: "Revue de littérature",
  PROBLEMATIQUE: "Problématique",
  PERSPECTIVES: "Perspectives",
};

const CATEGORY_ORDER: JuryQuestionCategory[] = [
  "PROBLEMATIQUE",
  "REVUE_LITTERATURE",
  "METHODOLOGIE",
  "RESULTATS",
  "PERSPECTIVES",
];

function storageKey(memoireId: string): string {
  return `thesus:jury-prepared:${memoireId}`;
}

export function JuryQuestionList({ memoireId, questions }: JuryQuestionListProps) {
  const [prepared, setPrepared] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(memoireId));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync avec localStorage (API externe) après montage, pour éviter un mismatch d'hydratation SSR.
      if (raw) setPrepared(JSON.parse(raw));
    } catch {
      // localStorage indisponible (navigation privée, etc.) — on ignore silencieusement.
    }
  }, [memoireId]);

  function toggle(questionId: string) {
    setPrepared((current) => {
      const next = { ...current, [questionId]: !current[questionId] };
      try {
        window.localStorage.setItem(storageKey(memoireId), JSON.stringify(next));
      } catch {
        // idem
      }
      return next;
    });
  }

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: questions
      .filter((question) => question.category === category)
      .sort((a, b) => a.order - b.order),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {grouped.map((group) => (
        <div key={group.category}>
          <h3 className="text-xs font-medium tracking-[1.5px] text-accent-dark uppercase">
            {CATEGORY_LABELS[group.category]}
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {group.items.map((question) => {
              const isPrepared = Boolean(prepared[question.id]);
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => toggle(question.id)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    isPrepared
                      ? "border-accent/40 bg-accent/5"
                      : "border-border-neutral bg-surface-light hover:border-accent/40"
                  }`}
                >
                  {isPrepared ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" />
                  ) : (
                    <Circle size={18} className="mt-0.5 shrink-0 text-ink-muted" />
                  )}
                  <div>
                    <p className="text-sm text-ink">{question.question}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {isPrepared ? "Préparée" : "À retravailler"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
