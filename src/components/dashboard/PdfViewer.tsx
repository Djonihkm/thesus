"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfViewerProps {
  fileUrl: string;
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    setStatus("loading");
    container.innerHTML = "";

    const loadingTask = pdfjsLib.getDocument({ url: fileUrl });

    (async () => {
      try {
        const pdf = await loadingTask.promise;
        const containerWidth = container.clientWidth;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNumber);
          const scale = containerWidth / page.getViewport({ scale: 1 }).width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.className = "mx-auto mb-4 block rounded-lg shadow-sm";
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          container.appendChild(canvas);

          await page.render({ canvas, viewport }).promise;
        }

        if (!cancelled) setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          console.error("Erreur de chargement du PDF:", error);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [fileUrl]);

  return (
    <div className="h-full w-full overflow-y-auto bg-surface-neutral p-4 md:p-8">
      {status === "loading" ? (
        <p className="py-10 text-center text-sm text-ink-muted">Chargement du document…</p>
      ) : null}
      {status === "error" ? (
        <p className="py-10 text-center text-sm text-flag">
          Impossible d&apos;afficher ce document.
        </p>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}
