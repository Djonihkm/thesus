"use client";

export function TabSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              selected
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 text-ink-muted hover:border-ink/30"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
