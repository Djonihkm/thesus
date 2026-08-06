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
import { ySyncPluginKey } from "y-prosemirror";

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

          // Une transaction issue de la synchronisation Yjs (contenu distant appliqué par
          // y-prosemirror, tagué isChangeOrigin — voir _typeChanged dans
          // y-prosemirror/src/plugins/sync-plugin.js) n'est pas une édition locale du
          // jury : c'est le document initial qui se charge à l'ouverture de la room, ou une
          // modification de l'étudiant qui arrive en direct. La bloquer comme une frappe
          // locale empêchait le document de s'afficher du tout côté jury (la toute première
          // synchronisation étant elle-même un remplacement de contenu, jamais un simple
          // AddMark/RemoveMark).
          const ySyncMeta = tr.getMeta(ySyncPluginKey) as { isChangeOrigin?: boolean } | undefined;
          if (ySyncMeta?.isChangeOrigin) return true;

          return tr.steps.every(
            (step) => step instanceof AddMarkStep || step instanceof RemoveMarkStep,
          );
        },
      }),
    ];
  },
});
