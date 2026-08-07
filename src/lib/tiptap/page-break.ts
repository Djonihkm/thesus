// src/lib/tiptap/page-break.ts
//
// Élément explicite de saut de page, pour structurer une page de garde ou des sections qui
// démarrent sur une nouvelle page. Le style de saut (page-break-after/break-after) est
// inline sur le noeud rendu — auto-porteur, aucune CSS externe requise côté export (Adobe
// HTMLToPDFJob comme html-to-docx honorent tous les deux cette propriété inline). Sur
// l'écran de l'éditeur, "page-break-after" n'a aucun effet (propriété ignorée hors contexte
// print) : le marqueur visuel vient uniquement de globals.css.
import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "page-break",
        style: "page-break-after: always; break-after: page;",
      }),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },
});
