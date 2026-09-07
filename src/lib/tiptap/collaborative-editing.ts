// src/lib/tiptap/collaborative-editing.ts
//
// Câble les plugins ProseMirror de y-prosemirror sur le Y.Doc fourni par le provider de
// collaboration temps réel (PartyKit, anciennement Y-Sweet — voir DocumentEditor.tsx) —
// awareness (curseurs/présence) comprise, nativement disponible côté protocole Yjs quel
// que soit le transport. Générique par construction (ne dépend que de Y.XmlFragment/
// Awareness, jamais d'un type propre à un backend), donc jamais eu besoin de changer lors
// du passage Liveblocks → Y-Sweet → PartyKit.
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

export interface CollaborativeEditingOptions {
  fragment: Y.XmlFragment | null;
  awareness: Awareness | null;
}

export const CollaborativeEditing = Extension.create<CollaborativeEditingOptions>({
  name: "collaborativeEditing",

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
