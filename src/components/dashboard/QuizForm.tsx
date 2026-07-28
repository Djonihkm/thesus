"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";
import { submitQuizAttemptAction, type QuizAttemptResultState } from "@/lib/actions/quiz";

interface QuizFormQuestion {
  id: string;
  question: string;
  choices: string[] | null;
  order: number;
}

interface QuizFormProps {
  quizId: string;
  questions: QuizFormQuestion[];
}

export function QuizForm({ quizId, questions }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResultState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const response = await submitQuizAttemptAction(quizId, answers);
    setIsSubmitting(false);
    if (response.error) {
      setError(response.error);
      return;
    }
    setResult(response);
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setError(null);
  }

  if (result?.results) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border-dark/10 bg-surface-light p-6">
          <p className="text-sm font-medium tracking-wide text-accent">Résultat</p>
          <p className="mt-2 text-2xl font-medium tracking-[-0.01em] text-ink">
            {result.correctCount}/{result.total} bonnes réponses ({result.score}%)
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {result.results.map((item, index) => (
            <div
              key={item.questionId}
              className={`rounded-2xl border p-5 ${
                item.isCorrect
                  ? "border-border-dark/10 bg-surface-light"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p className="text-sm font-medium text-ink">
                {index + 1}. {item.question}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Votre réponse : <span className="text-ink">{item.given || "(vide)"}</span>
              </p>
              {!item.isCorrect && (
                <p className="mt-1 text-sm text-ink-muted">
                  Bonne réponse : <span className="text-ink">{item.correctAnswer}</span>
                </p>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          tone="light"
          variant="outline"
          onClick={handleRetry}
          className="self-start"
        >
          Refaire le quiz
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error ? <FormError message={error} /> : null}

      {questions.map((question, index) => (
        <div
          key={question.id}
          className="rounded-2xl border border-border-dark/10 bg-surface-light p-5"
        >
          <p className="text-sm font-medium text-ink">
            {index + 1}. {question.question}
          </p>

          {question.choices ? (
            <div className="mt-4 flex flex-col gap-2">
              {question.choices.map((choice) => (
                <label
                  key={choice}
                  className="flex items-center gap-3 rounded-lg border border-ink/10 px-3 py-2 text-sm text-ink hover:bg-surface-neutral"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={choice}
                    checked={answers[question.id] === choice}
                    onChange={() =>
                      setAnswers((current) => ({ ...current, [question.id]: choice }))
                    }
                  />
                  {choice}
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={answers[question.id] ?? ""}
              onChange={(event) =>
                setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
              }
              className="mt-4 w-full rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors focus:border-accent"
              placeholder="Votre réponse"
            />
          )}
        </div>
      ))}

      <Button
        type="submit"
        tone="light"
        variant="primary"
        disabled={isSubmitting}
        className="self-start"
      >
        {isSubmitting ? "Envoi…" : "Valider mes réponses"}
      </Button>
    </form>
  );
}
