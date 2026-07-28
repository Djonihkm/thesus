// src/components/dashboard/StatTile.tsx
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-dark/10 bg-surface-light p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.01em] text-ink">{value}</p>
    </div>
  );
}
