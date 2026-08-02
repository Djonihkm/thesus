import type { ReactNode } from "react";

interface TwoToneCardProps {
  dark: ReactNode;
  light: ReactNode;
}

export function TwoToneCard({ dark, light }: TwoToneCardProps) {
  return (
    <div className="grid overflow-hidden rounded-3xl shadow-xl shadow-ink/20 sm:grid-cols-2">
      <div className="relative overflow-hidden bg-ink px-8 py-12 text-paper sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-accent-lime/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-6 -bottom-12 h-48 w-48 rounded-full bg-accent-on-dark/15 blur-3xl" />
        <div className="relative">{dark}</div>
      </div>
      <div className="flex flex-col justify-center bg-surface-light px-8 py-12 sm:px-10 sm:py-14">
        {light}
      </div>
    </div>
  );
}
