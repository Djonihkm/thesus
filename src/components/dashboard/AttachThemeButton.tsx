"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { attachCurrentThemeToMemoireAction } from "@/lib/actions/memoires";

export function AttachThemeButton({
  memoireId,
  themeTitle,
}: {
  memoireId: string;
  themeTitle: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);
    const result = await attachCurrentThemeToMemoireAction(memoireId);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Link2 size={14} />
        {isPending ? "Rattachement…" : `Rattacher au thème « ${themeTitle} »`}
      </button>
      {error ? (
        <div className="mt-2">
          <FormError message={error} />
        </div>
      ) : null}
    </div>
  );
}
