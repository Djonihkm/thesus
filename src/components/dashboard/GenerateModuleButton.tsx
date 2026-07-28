"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";
import type { GenerateModuleActionState } from "@/lib/actions/quiz";

interface GenerateModuleButtonProps {
  action: (memoireId: string) => Promise<GenerateModuleActionState>;
  memoireId: string;
  label: string;
  pendingLabel: string;
  description?: string;
}

const initialState: GenerateModuleActionState = {};

export function GenerateModuleButton({
  action,
  memoireId,
  label,
  pendingLabel,
  description,
}: GenerateModuleButtonProps) {
  const [state, formAction, isPending] = useActionState(
    async () => action(memoireId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-4">
      {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      {state.error ? <FormError message={state.error} /> : null}
      <Button type="submit" tone="light" variant="primary" disabled={isPending}>
        {isPending ? pendingLabel : label}
      </Button>
    </form>
  );
}
