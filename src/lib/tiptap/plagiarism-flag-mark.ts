// src/lib/tiptap/plagiarism-flag-mark.ts
//
// Extension dédiée au passage "signalé comme plagié" par le jury — distincte du
// surlignage normal (Highlight) pour pouvoir un jour (Phase 2) l'appliquer
// automatiquement à partir des positions détectées par le module anti-plagiat.
// Pas de bouton pour l'appliquer manuellement dans cette phase : seule l'extension
// (et son style) est prête à recevoir cette donnée.
import { Mark, mergeAttributes } from "@tiptap/core";

export const PlagiarismFlag = Mark.create({
  name: "plagiarismFlag",

  parseHTML() {
    return [{ tag: "mark[data-plagiarism-flag]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(HTMLAttributes, {
        "data-plagiarism-flag": "true",
        class: "plagiarism-flag-mark",
      }),
      0,
    ];
  },
});
