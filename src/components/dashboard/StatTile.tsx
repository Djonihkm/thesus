// src/components/dashboard/StatTile.tsx
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-neutral bg-surface-light p-5 shadow-md shadow-ink/8">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 font-serif text-2xl font-normal tracking-[-0.01em] text-ink">{value}</p>
    </div>
  );
}
