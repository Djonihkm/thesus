"use client";

import { useCallback, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight, GripVertical } from "lucide-react";
import { imageStyleObject, type ImageAlign } from "@/lib/tiptap/resizable-image";

const ALIGN_OPTIONS: { value: ImageAlign; icon: typeof AlignLeft; label: string }[] = [
  { value: "left", icon: AlignLeft, label: "Aligner à gauche" },
  { value: "center", icon: AlignCenter, label: "Centrer" },
  { value: "right", icon: AlignRight, label: "Aligner à droite" },
];

const MIN_WIDTH = 80;

// NodeView interactif de l'image : poignée de redimensionnement (coin bas-droit, glisser
// pour changer la largeur) + mini barre d'alignement, affichées seulement quand le noeud est
// sélectionné. Le style appliqué ici (imageStyleObject) est exactement celui sérialisé par
// ResizableImage.renderHTML — l'éditeur affiche donc toujours ce qui sera réellement exporté.
export function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, title, width, align } = node.attrs as {
    src: string;
    alt: string | null;
    title: string | null;
    width: number | null;
    align: ImageAlign;
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = containerRef.current?.offsetWidth ?? 300;
      setIsResizing(true);

      function onMouseMove(moveEvent: globalThis.MouseEvent) {
        const delta = moveEvent.clientX - startX;
        const nextWidth = Math.max(MIN_WIDTH, Math.round(startWidth + delta));
        updateAttributes({ width: nextWidth });
      }
      function onMouseUp() {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [updateAttributes],
  );

  const wrapperStyle: CSSProperties = {
    ...(imageStyleObject(width, align) as CSSProperties),
    position: "relative",
  };

  return (
    <NodeViewWrapper
      as="div"
      ref={containerRef}
      data-align={align}
      contentEditable={false}
      draggable
      className="leading-none"
      style={wrapperStyle}
    >
      {selected ? (
        // Le déplacement natif vient de ProseMirror lui-même : le schéma du noeud image est
        // draggable (hérité de l'extension Image standard), donc un glisser-déposer démarré
        // n'importe où sur le NodeView le déplace déjà — vérifié dans le code source de
        // prosemirror-view (handlers.dragstart), pas de convention "drag handle" séparée
        // dans cette version. Cette poignée n'est donc qu'un repère visuel indiquant où
        // saisir, elle n'est pas techniquement requise ; la poignée de redimensionnement,
        // elle, coupe la propagation de son mousedown pour ne jamais être interprétée comme
        // un déplacement.
        <span
          role="presentation"
          title="Déplacer l'image"
          className="absolute -top-2 -left-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-full border border-border-neutral bg-surface-light text-ink-muted shadow active:cursor-grabbing"
        >
          <GripVertical size={13} />
        </span>
      ) : null}

      {selected ? (
        <div className="absolute -top-9 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border-neutral bg-surface-light p-1 shadow-lg">
          {ALIGN_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              title={option.label}
              aria-label={option.label}
              aria-pressed={align === option.value}
              onClick={() => updateAttributes({ align: option.value })}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                align === option.value
                  ? "bg-accent/15 text-accent-dark"
                  : "text-ink-muted hover:bg-surface-neutral hover:text-ink"
              }`}
            >
              <option.icon size={13} />
            </button>
          ))}
        </div>
      ) : null}

      {/* next/image ne convient pas ici : NodeView Tiptap avec redimensionnement piloté par
          l'utilisateur (largeur dynamique, pas de dimensions connues à l'avance), sur des
          URLs de blob privé arbitraires. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ""}
        title={title ?? undefined}
        draggable={false}
        className={`block w-full rounded-lg ${selected ? "outline outline-2 outline-accent outline-offset-2" : ""}`}
      />

      {selected ? (
        <span
          onMouseDown={startResize}
          role="presentation"
          className={`absolute right-0 bottom-0 h-3.5 w-3.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-sm border-2 border-surface-light bg-accent shadow ${
            isResizing ? "scale-110" : ""
          }`}
        />
      ) : null}
    </NodeViewWrapper>
  );
}
