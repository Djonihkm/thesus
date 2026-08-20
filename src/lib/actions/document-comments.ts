"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessMemoireDocument } from "@/lib/document-access";
import type { User, Memoire } from "@prisma/client";

export interface DocumentCommentReplyView {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface DocumentCommentView {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  resolved: boolean;
  anchorFrom: string | null;
  anchorTo: string | null;
  replies: DocumentCommentReplyView[];
}

type AccessResult = { user: User; memoire: Memoire } | { error: string };

// Revérifie toujours l'accès en base, même si l'action n'est appelée que depuis une page déjà
// protégée par requireRole — une Server Action reste un endpoint public appelable directement
// avec n'importe quel memoireId, même règle que canAccessMemoireDocument pour la room Y-Sweet.
async function getAccessibleMemoire(memoireId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user) return { error: "Non authentifié." };

  const [user, memoire] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.memoire.findUnique({ where: { id: memoireId } }),
  ]);

  if (!user || !memoire) return { error: "Mémoire introuvable." };
  if (!canAccessMemoireDocument(user, memoire)) return { error: "Accès refusé." };

  return { user, memoire };
}

export async function getDocumentCommentsAction(
  memoireId: string,
): Promise<{ comments: DocumentCommentView[] } | { error: string }> {
  const access = await getAccessibleMemoire(memoireId);
  if ("error" in access) return access;

  const roots = await prisma.documentComment.findMany({
    where: { memoireId, parentId: null, resolved: false },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  return {
    comments: roots.map((comment) => ({
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.author.name,
      createdAt: comment.createdAt.toISOString(),
      resolved: comment.resolved,
      anchorFrom: comment.anchorFrom,
      anchorTo: comment.anchorTo,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        authorId: reply.authorId,
        authorName: reply.author.name,
        createdAt: reply.createdAt.toISOString(),
      })),
    })),
  };
}

export type CreateDocumentCommentState = { error?: string; comment?: DocumentCommentView };

export async function createDocumentCommentAction(
  memoireId: string,
  content: string,
  anchor: { anchorFrom: string; anchorTo: string } | null,
): Promise<CreateDocumentCommentState> {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Le commentaire ne peut pas être vide." };

  const access = await getAccessibleMemoire(memoireId);
  if ("error" in access) return access;

  const comment = await prisma.documentComment.create({
    data: {
      memoireId,
      authorId: access.user.id,
      content: trimmed,
      anchorFrom: anchor?.anchorFrom,
      anchorTo: anchor?.anchorTo,
    },
    include: { author: { select: { name: true } } },
  });

  return {
    comment: {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.author.name,
      createdAt: comment.createdAt.toISOString(),
      resolved: comment.resolved,
      anchorFrom: comment.anchorFrom,
      anchorTo: comment.anchorTo,
      replies: [],
    },
  };
}

export type ReplyDocumentCommentState = { error?: string; reply?: DocumentCommentReplyView };

export async function replyToDocumentCommentAction(
  memoireId: string,
  parentId: string,
  content: string,
): Promise<ReplyDocumentCommentState> {
  const trimmed = content.trim();
  if (!trimmed) return { error: "La réponse ne peut pas être vide." };

  const access = await getAccessibleMemoire(memoireId);
  if ("error" in access) return access;

  const parent = await prisma.documentComment.findUnique({ where: { id: parentId } });
  if (!parent || parent.memoireId !== memoireId || parent.parentId !== null) {
    return { error: "Fil de discussion introuvable." };
  }

  const reply = await prisma.documentComment.create({
    data: { memoireId, authorId: access.user.id, content: trimmed, parentId },
    include: { author: { select: { name: true } } },
  });

  return {
    reply: {
      id: reply.id,
      content: reply.content,
      authorId: reply.authorId,
      authorName: reply.author.name,
      createdAt: reply.createdAt.toISOString(),
    },
  };
}

export type ResolveDocumentCommentState = { error?: string; success?: boolean };

export async function resolveDocumentCommentAction(
  memoireId: string,
  commentId: string,
  resolved: boolean,
): Promise<ResolveDocumentCommentState> {
  const access = await getAccessibleMemoire(memoireId);
  if ("error" in access) return access;

  const comment = await prisma.documentComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.memoireId !== memoireId || comment.parentId !== null) {
    return { error: "Fil de discussion introuvable." };
  }

  await prisma.documentComment.update({ where: { id: commentId }, data: { resolved } });
  return { success: true };
}

export type DeleteDocumentCommentState = { error?: string; success?: boolean };

export async function deleteDocumentCommentAction(
  memoireId: string,
  commentId: string,
): Promise<DeleteDocumentCommentState> {
  const access = await getAccessibleMemoire(memoireId);
  if ("error" in access) return access;

  const comment = await prisma.documentComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.memoireId !== memoireId) {
    return { error: "Commentaire introuvable." };
  }
  // Seul l'auteur peut supprimer son propre commentaire — contrairement à résoudre, qui
  // reste ouvert aux deux parties (étudiant et jury) tant qu'elles ont accès au document.
  if (comment.authorId !== access.user.id) {
    return { error: "Vous ne pouvez supprimer que vos propres commentaires." };
  }

  // Supprime aussi les réponses (onDelete: Cascade sur la relation parent/replies) si c'est
  // un commentaire racine.
  await prisma.documentComment.delete({ where: { id: commentId } });
  return { success: true };
}
