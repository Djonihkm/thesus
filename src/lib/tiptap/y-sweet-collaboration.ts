// src/lib/tiptap/y-sweet-collaboration.ts
//
// Remplace @liveblocks/react-tiptap's useLiveblocksExtension : Y-Sweet est un backend Yjs
// standard (contrairement à Liveblocks, qui packageait sa propre intégration), donc on
// câble nous-mêmes les plugins ProseMirror de y-prosemirror sur le Y.Doc fourni par le
// provider Y-Sweet — awareness (curseurs/présence) comprise, nativement disponible côté
// protocole Yjs quel que soit le backend.
//
// y-prosemirror est déjà une dépendance du projet (utilisée par annotate-only-plugin.ts,
// qui importe ySyncPluginKey pour reconnaître les transactions de synchronisation Yjs) :
// en réutilisant le même package ici plutôt qu'une alternative comme @tiptap/y-tiptap, le
// plugin de restriction du mode annotation continue de fonctionner sans aucune modification.
import { Extension } from "@tiptap/core";
import { keymap } from "@tiptap/pm/keymap";
import * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undoCommand, redoCommand } from "y-prosemirror";

export interface YSweetCollaborationOptions {
  fragment: Y.XmlFragment | null;
  awareness: Awareness | null;
}

export const YSweetCollaboration = Extension.create<YSweetCollaborationOptions>({
  name: "ySweetCollaboration",

  addOptions() {
    return { fragment: null, awareness: null };
  },

  addProseMirrorPlugins() {
    const { fragment, awareness } = this.options;
    if (!fragment || !awareness) return [];

    return [
      ySyncPlugin(fragment),
      yCursorPlugin(awareness),
      yUndoPlugin(),
      keymap({
        "Mod-z": (state, dispatch) => undoCommand(state, dispatch),
        "Mod-y": (state, dispatch) => redoCommand(state, dispatch),
        "Mod-Shift-z": (state, dispatch) => redoCommand(state, dispatch),
      }),
    ];
  },
});
