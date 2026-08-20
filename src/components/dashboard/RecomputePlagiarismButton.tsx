"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { recomputePlagiarismReportAction } from "@/lib/actions/plagiarism";

export function RecomputePlagiarismButton({ memoireId }: { memoireId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);
    const result = await recomputePlagiarismReportAction(memoireId);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-neutral disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={14} className={isPending ? "animate-spin" : undefined} />
        {isPending ? "Analyse en cours…" : "Relancer l'analyse anti-plagiat"}
      </button>
      {error ? (
        <div className="mt-2">
          <FormError message={error} />
        </div>
      ) : null}
    </div>
  );
}
