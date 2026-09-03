"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type QuestionType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuiz } from "@/lib/quiz";
import { getStudentPlan } from "@/lib/subscription";

export type GenerateModuleActionState = {
  error?: string;
  success?: boolean;
};

function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Pas de choices (TEXTE_TROU) : rien à recaler, la comparaison à la soumission est déjà
// normalisée. Avec choices (QCU/VRAI_FAUX) : si correctAnswer ne correspond exactement à
// aucune valeur de choices mais qu'une correspondance normalisée existe, on stocke la
// valeur de choices elle-même (garantit une égalité stricte possible côté affichage et
// filet de sécurité si la comparaison à la soumission redevenait stricte un jour).
function reconcileCorrectAnswer(correctAnswer: string, choices: string[] | null): string {
  if (!choices || choices.includes(correctAnswer)) return correctAnswer;
  const match = choices.find((choice) => normalizeAnswer(choice) === normalizeAnswer(correctAnswer));
  return match ?? correctAnswer;
}

export async function generateQuizAction(memoireId: string): Promise<GenerateModuleActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const memoire = await prisma.memoire.findUnique({ where: { id: memoireId } });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }
  if (memoire.status !== "COMPLETED" || !memoire.extractedText) {
    return { error: "L'audit du mémoire doit être terminé avant de générer le quiz." };
  }

  const existing = await prisma.quiz.findUnique({ where: { memoireId } });
  if (existing) {
    return { success: true };
  }

  try {
    const { limits } = await getStudentPlan(session.user.id);
    const questions = await generateQuiz(memoire.extractedText, limits.quizMaxQuestions);

    await prisma.quiz.create({
      data: {
        memoireId,
        questions: {
          create: questions.map((question) => ({
            type: question.type,
            question: question.question,
            choices: question.choices
              ? (question.choices as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            // Le modèle est instruit de renvoyer correctAnswer identique à une valeur de
            // choices, mais rien ne le garantit structurellement (pas de contrainte de
            // schéma possible ici) — un espace ou une casse différente rendrait la question
            // impossible à réussir même en cochant la bonne case. On aligne donc
            // correctAnswer sur la valeur de choices la plus proche (comparaison
            // insensible à la casse/aux accents) quand elle existe, plutôt que de stocker
            // tel quel ce que le modèle a renvoyé.
            correctAnswer: reconcileCorrectAnswer(question.correctAnswer, question.choices),
            order: question.order,
          })),
        },
      },
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Échec de la génération du quiz.",
    };
  }

  revalidatePath(`/dashboard/etudiant/memoires/${memoireId}/quiz`);
  revalidatePath(`/dashboard/etudiant/memoires/${memoireId}`);
  return { success: true };
}

export interface QuizQuestionResult {
  questionId: string;
  question: string;
  type: QuestionType;
  choices: string[] | null;
  correctAnswer: string;
  given: string;
  isCorrect: boolean;
}

export type QuizAttemptResultState = {
  error?: string;
  score?: number;
  correctCount?: number;
  total?: number;
  results?: QuizQuestionResult[];
};

export async function submitQuizAttemptAction(
  quizId: string,
  answers: Record<string, string>,
): Promise<QuizAttemptResultState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: "asc" } }, memoire: true },
  });

  if (!quiz || quiz.memoire.studentId !== session.user.id) {
    return { error: "Quiz introuvable." };
  }

  const results: QuizQuestionResult[] = quiz.questions.map((question) => {
    const given = answers[question.id] ?? "";
    // Comparaison normalisée pour tous les types — pas seulement TEXTE_TROU. Pour QCU/
    // VRAI_FAUX, given provient d'une sélection contrôlée parmi choices (jamais de saisie
    // libre côté client) : une comparaison stricte n'apportait aucune garantie
    // supplémentaire, seulement un risque si correctAnswer différait de choices par un
    // espace ou une casse — voir reconcileCorrectAnswer à la génération.
    const isCorrect = normalizeAnswer(given) === normalizeAnswer(question.correctAnswer);

    return {
      questionId: question.id,
      question: question.question,
      type: question.type,
      choices: (question.choices as string[] | null) ?? null,
      correctAnswer: question.correctAnswer,
      given,
      isCorrect,
    };
  });

  const total = results.length;
  const correctCount = results.filter((result) => result.isCorrect).length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  await prisma.quizAttempt.create({
    data: {
      quizId,
      studentId: session.user.id,
      score,
      answers: answers as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/dashboard/etudiant/memoires/${quiz.memoireId}/quiz`);

  return { score, correctCount, total, results };
}
