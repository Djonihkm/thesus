import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function FormField({ label, id, name, ...props }: FormFieldProps) {
  const inputId = id ?? name;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm text-ink-muted">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className="rounded-lg border border-ink/15 bg-surface-light px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent"
        {...props}
      />
    </div>
  );
}
