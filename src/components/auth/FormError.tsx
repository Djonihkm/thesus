export function FormError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-flag/20 bg-flag-soft px-4 py-3 text-sm text-flag">
      {message}
    </p>
  );
}
