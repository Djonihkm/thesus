"use client";

import { useEffect, useState } from "react";
import { X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PdfViewer } from "@/components/dashboard/PdfViewer";

interface DocumentViewerModalProps {
  documentUrl: string;
  title: string;
  fileType: "PDF" | "DOCX";
}

export function DocumentViewerModal({ documentUrl, title, fileType }: DocumentViewerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <Button type="button" variant="outline" tone="light" onClick={() => setIsOpen(true)}>
        <BookOpen size={16} className="mr-2" />
        Lire le mémoire
      </Button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 md:p-10"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface-light shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border-dark/10 px-6 py-4">
              <p className="truncate pr-4 text-sm font-medium text-ink">{title}</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
                className="shrink-0 rounded-full p-1.5 text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            {fileType === "PDF" ? (
              <PdfViewer fileUrl={documentUrl} />
            ) : (
              <iframe src={documentUrl} title={title} className="w-full flex-1 bg-surface-light" />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
