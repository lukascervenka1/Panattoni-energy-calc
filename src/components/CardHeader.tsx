export function CardHeader({ step, label }: { step: number; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold"
        style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-muted)" }}
      >
        {step}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
