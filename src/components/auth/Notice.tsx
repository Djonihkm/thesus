export function Notice({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink">
      {message}
    </div>
  );
}
