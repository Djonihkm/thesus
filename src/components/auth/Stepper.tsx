export function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <div className="flex gap-2">
        {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-accent" : "bg-ink/10"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-ink-muted">
        Étape {step} sur {total}
      </span>
    </div>
  );
}
