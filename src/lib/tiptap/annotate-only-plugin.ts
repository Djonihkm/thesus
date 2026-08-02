// src/lib/tiptap/annotate-only-plugin.ts
//
// Restreint l'éditeur à des transactions de marks uniquement (surlignage, soulignage,
// signalement) : rejette toute transaction qui modifie le contenu texte lui-même
// (insertion, suppression, découpage/fusion de blocs). C'est la barrière technique
// réelle derrière le mode "annotation" du jury — Liveblocks n'a pas de permission plus
// fine que lecture/écriture par room, donc cette restriction vit côté éditeur, pas côté
// serveur Liveblocks.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { AddMarkStep, RemoveMarkStep } from "@tiptap/pm/transform";

export const AnnotateOnly = Extension.create({
  name: "annotateOnly",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("annotateOnly"),
        filterTransaction(tr) {
          // Les transactions qui ne modifient pas le document (sélection, historique
          // interne, synchronisation Yjs de métadonnées) n'ont pas de steps : toujours
          // autorisées.
          if (tr.steps.length === 0) return true;

          return tr.steps.every(
            (step) => step instanceof AddMarkStep || step instanceof RemoveMarkStep,
          );
        },
      }),
    ];
  },
});
