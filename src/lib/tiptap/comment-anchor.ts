// src/lib/tiptap/comment-anchor.ts
//
// Convertit une sélection ProseMirror (positions absolues, qui se décalent à chaque édition)
// en positions *relatives* Yjs (qui restent valides après des éditions concurrentes ailleurs
// dans le document) pour les stocker durablement en base sur DocumentComment, et inversement
// pour retrouver l'emplacement exact au rendu. Nécessite le binding y-prosemirror actif sur
// l'éditeur (posé par CollaborativeEditing, voir collaborative-editing.ts).
import type { Editor } from "@tiptap/core";
import * as Y from "yjs";
import { ySyncPluginKey, absolutePositionToRelativePosition, relativePositionToAbsolutePosition } from "y-prosemirror";

// y-prosemirror ne publie pas de type pour la forme exacte de son état de plugin (accessible
// via ySyncPluginKey.getState) ni pour son ProsemirrorMapping interne — `any` documente
// honnêtement qu'on s'appuie ici sur la forme runtime réelle, pas sur un contrat typé public.
interface YSyncPluginState {
  type: Y.XmlFragment;
  doc: Y.Doc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- voir le commentaire ci-dessus
  binding?: { mapping: Map<Y.AbstractType<any>, any> };
}

function getSyncState(editor: Editor): YSyncPluginState | null {
  const state = ySyncPluginKey.getState(editor.state) as YSyncPluginState | undefined;
  return state?.binding ? state : null;
}

export interface CommentAnchor {
  anchorFrom: string;
  anchorTo: string;
}

export function encodeCommentAnchor(editor: Editor, from: number, to: number): CommentAnchor | null {
  const syncState = getSyncState(editor);
  if (!syncState?.binding) return null;

  const relFrom = absolutePositionToRelativePosition(from, syncState.type, syncState.binding.mapping);
  const relTo = absolutePositionToRelativePosition(to, syncState.type, syncState.binding.mapping);

  return {
    anchorFrom: JSON.stringify(Y.relativePositionToJSON(relFrom)),
    anchorTo: JSON.stringify(Y.relativePositionToJSON(relTo)),
  };
}

// Renvoie null si le passage ancré a été supprimé du document depuis (position Yjs qui ne
// se résout plus) — appelant responsable d'ignorer proprement ce commentaire dans ce cas.
export function decodeCommentAnchor(
  editor: Editor,
  anchor: CommentAnchor,
): { from: number; to: number } | null {
  const syncState = getSyncState(editor);
  if (!syncState?.binding) return null;

  try {
    const relFrom = Y.createRelativePositionFromJSON(JSON.parse(anchor.anchorFrom));
    const relTo = Y.createRelativePositionFromJSON(JSON.parse(anchor.anchorTo));

    const from = relativePositionToAbsolutePosition(syncState.doc, syncState.type, relFrom, syncState.binding.mapping);
    const to = relativePositionToAbsolutePosition(syncState.doc, syncState.type, relTo, syncState.binding.mapping);

    if (from === null || to === null || from >= to) return null;
    return { from, to };
  } catch {
    return null;
  }
}
