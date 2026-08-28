export function CardHeader({ step, label }: { step: number; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold text-white"
        style={{ background: "var(--color-navy)" }}
      >
        {step}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
