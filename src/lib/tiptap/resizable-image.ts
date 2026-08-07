// src/lib/tiptap/resizable-image.ts
//
// Étend l'extension Image standard avec largeur et alignement — rendus en style inline
// directement sur le noeud (width en px, alignement via float gauche/droite — habillage de
// texte "gratuit" en CSS standard — ou centrage en display:block). Auto-porteur comme
// PageBreak : ni Adobe HTMLToPDFJob ni html-to-docx n'ont besoin d'une feuille de style
// externe pour respecter ces styles, ce qui garantit la fidélité éditeur -> export.
import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageView } from "@/components/document/ResizableImageView";

export type ImageAlign = "left" | "center" | "right";

// Objet de style (clés camelCase) réutilisé tel quel comme style inline React dans le
// NodeView, et converti en chaîne CSS pour le HTML sérialisé/exporté — une seule logique
// pour les deux rendus, jamais désynchronisés.
export function imageStyleObject(width: number | null, align: ImageAlign): Record<string, string> {
  const style: Record<string, string> = { maxWidth: "100%" };
  if (width) style.width = `${width}px`;

  if (align === "left") {
    style.float = "left";
    style.margin = "0 1.5em 1em 0";
  } else if (align === "right") {
    style.float = "right";
    style.margin = "0 0 1em 1.5em";
  } else {
    style.display = "block";
    style.margin = "0 auto 1em";
    style.float = "none";
  }

  return style;
}

function styleObjectToCss(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value}`)
    .join("; ");
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      align: { default: "left" },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, ...rest } = HTMLAttributes;
    const resolvedAlign = (align as ImageAlign) ?? "left";
    return [
      "img",
      mergeAttributes(rest, {
        "data-align": resolvedAlign,
        style: styleObjectToCss(imageStyleObject(width ? Number(width) : null, resolvedAlign)),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
