// src/lib/tiptap/document-comment-mark.ts
//
// Marque le passage de texte ancré par un fil de commentaire — distincte du surlignage
// normal (Highlight, fond plein) et du signalement anti-plagiat (PlagiarismFlag, voir
// globals.css) : un simple soulignement pointillé, pour rester lisible même quand les
// trois se superposent sur le même passage. excludes: "" autorise plusieurs commentaires
// différents (attrs commentId distincts) à se chevaucher sur le même texte.
import { Mark, mergeAttributes } from "@tiptap/core";

export interface DocumentCommentMarkAttributes {
  commentId: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    documentComment: {
      setDocumentComment: (attributes: DocumentCommentMarkAttributes) => ReturnType;
      unsetDocumentCommentById: (commentId: string) => ReturnType;
    };
  }
}

export const DocumentCommentMark = Mark.create({
  name: "documentComment",

  excludes: "",

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes) =>
          attributes.commentId ? { "data-comment-id": attributes.commentId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "document-comment-mark" }), 0];
  },

  addCommands() {
    return {
      setDocumentComment:
        (attributes) =>
        ({ commands }) =>
          commands.setMark(this.name, attributes),

      // Retire uniquement les instances de cette marque portant ce commentId précis — un
      // simple unsetMark(this.name) retirerait aussi les marques d'autres commentaires
      // chevauchant la même sélection.
      unsetDocumentCommentById:
        (commentId) =>
        ({ tr, state, dispatch }) => {
          const markType = state.schema.marks[this.name];
          state.doc.descendants((node, pos) => {
            const mark = node.marks.find(
              (candidate) => candidate.type === markType && candidate.attrs.commentId === commentId,
            );
            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, mark);
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});
