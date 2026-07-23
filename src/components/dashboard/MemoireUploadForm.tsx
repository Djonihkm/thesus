"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { UploadCloud } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { createMemoireAction } from "@/lib/actions/memoires";
import { MAX_FILE_SIZE_BYTES, isAllowedMimeType } from "@/lib/memoire-upload";

function validateFile(file: File): string | null {
  if (!isAllowedMimeType(file.type)) {
    return "Seuls les fichiers PDF et Word (.docx) sont acceptés.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Le fichier dépasse la taille maximale autorisée (20 Mo).";
  }
  return null;
}

export function MemoireUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        const blob = await upload(file.name, file, {
          access: "private",
          handleUploadUrl: "/api/memoires/blob-upload",
        });

        const result = await createMemoireAction({
          blobUrl: blob.url,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });

        if (result.error || !result.memoireId) {
          setError(result.error ?? "Une erreur est survenue lors du dépôt du mémoire.");
          setIsUploading(false);
          return;
        }

        router.push(`/dashboard/etudiant/memoires/${result.memoireId}`);
      } catch {
        setError("Une erreur est survenue pendant l'envoi du fichier.");
        setIsUploading(false);
      }
    },
    [router],
  );

  return (
    <div>
      {error ? (
        <div className="mb-4">
          <FormError message={error} />
        </div>
      ) : null}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        onClick={() => {
          if (!isUploading) inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-border-dark/20 hover:border-accent/40"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-neutral text-ink">
          <UploadCloud size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">
            {isUploading
              ? "Envoi en cours…"
              : "Glissez votre mémoire ici ou cliquez pour parcourir"}
          </p>
          <p className="mt-1 text-xs text-ink-muted">PDF ou Word (.docx), 20 Mo maximum</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
