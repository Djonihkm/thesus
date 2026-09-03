"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateChatReply, type ChatTurn } from "@/lib/ai-chat";
import { getStudentPlan } from "@/lib/subscription";
import { logError } from "@/lib/log-error";

const MAX_HISTORY_MESSAGES = 20;

export interface ChatMessageView {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export type SendChatMessageState = {
  error?: string;
  userMessage?: ChatMessageView;
  assistantMessage?: ChatMessageView;
};

// Chat IA de co-rédaction — étudiant uniquement, sur son propre mémoire (uploadé ou rédigé
// à partir de zéro, aucune distinction ici). Ne modifie jamais le document lui-même :
// l'insertion d'une réponse dans l'éditeur est une action distincte, déclenchée côté client
// (voir DocumentEditor.tsx), jamais automatique.
export async function sendAiChatMessageAction(
  memoireId: string,
  content: string,
): Promise<SendChatMessageState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Vous devez être connecté en tant qu'étudiant." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: "Écrivez un message avant d'envoyer." };
  }

  const { limits } = await getStudentPlan(session.user.id);
  if (!limits.aiWritingAssistant) {
    return { error: "L'assistant IA de rédaction n'est pas inclus dans votre plan." };
  }

  const memoire = await prisma.memoire.findUnique({
    where: { id: memoireId },
    include: { theme: { select: { title: true } } },
  });
  if (!memoire || memoire.studentId !== session.user.id) {
    return { error: "Mémoire introuvable." };
  }

  const previousMessages = await prisma.aiChatMessage.findMany({
    where: { memoireId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY_MESSAGES,
  });
  previousMessages.reverse();

  const userMessage = await prisma.aiChatMessage.create({
    data: { memoireId, role: "USER", content: trimmed },
  });
  const userMessageView: ChatMessageView = {
    id: userMessage.id,
    role: "USER",
    content: userMessage.content,
    createdAt: userMessage.createdAt.toISOString(),
  };

  const history: ChatTurn[] = [
    ...previousMessages.map((message) => ({ role: message.role, content: message.content })),
    { role: "USER", content: trimmed },
  ];

  try {
    const replyText = await generateChatReply({
      themeTitle: memoire.theme?.title ?? null,
      editableContent: memoire.editableContent,
      history,
    });

    const assistantMessage = await prisma.aiChatMessage.create({
      data: { memoireId, role: "ASSISTANT", content: replyText },
    });

    return {
      userMessage: userMessageView,
      assistantMessage: {
        id: assistantMessage.id,
        role: "ASSISTANT",
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
    };
  } catch (error) {
    logError("actions/ai-chat:sendAiChatMessageAction", error, { memoireId });
    return {
      error: "L'assistant n'a pas pu répondre pour le moment. Réessayez dans un instant.",
      userMessage: userMessageView,
    };
  }
}
