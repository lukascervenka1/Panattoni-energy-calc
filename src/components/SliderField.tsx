"use client";

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  const display = formatValue ? formatValue(value) : value.toLocaleString("cs-CZ");
  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[150px_1fr_120px] sm:gap-3">
      <label className="text-sm text-[var(--color-text-muted)]">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div
        className="rounded-md border px-3 py-1.5 text-right text-sm font-medium"
        style={{
          borderColor: "var(--color-border-default)",
          background: "var(--color-bg)",
        }}
      >
        {display} {unit}
      </div>
    </div>
  );
}
