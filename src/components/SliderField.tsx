"use client";

import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n";

/** Accepts what people actually type: "1 200", "1 200,5", "1200.5", "1.200". */
function parseTyped(raw: string): number | null {
  const cleaned = raw
    .replace(/\s| | /g, "")
    .replace(",", ".")
    .trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatForLocale(n: number, locale: Locale, decimals: number): string {
  return n.toLocaleString(locale === "en" ? "en-GB" : "cs-CZ", {
    maximumFractionDigits: decimals,
  });
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  locale,
  hint,
  toDisplay,
  fromDisplay,
  decimals = 0,
}: {
  label: string;
  /** Canonical value the slider and the calculation work with. */
  value: number;
  min: number;
  max: number;
  step: number;
  /** Unit shown next to the editable field (may differ from the canonical unit). */
  unit: string;
  onChange: (v: number) => void;
  locale: Locale;
  /** Small secondary line, e.g. the derived per-m² intensity. */
  hint?: string;
  /** Canonical -> the number shown in the editable field. */
  toDisplay?: (v: number) => number;
  /** The typed number -> canonical. */
  fromDisplay?: (d: number) => number;
  decimals?: number;
}) {
  const id = useId();
  // While the field has focus we keep the raw string so typing "1 2" or a
  // trailing separator isn't reformatted out from under the cursor.
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue = toDisplay ? toDisplay(value) : value;
  const shown = draft ?? formatForLocale(displayValue, locale, decimals);

  function commit(raw: string) {
    setDraft(raw);
    const parsed = parseTyped(raw);
    if (parsed === null) return;
    const canonical = fromDisplay ? fromDisplay(parsed) : parsed;
    onChange(Math.min(max, Math.max(min, canonical)));
  }

  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[150px_1fr_150px] sm:gap-3">
      <label htmlFor={id} className="text-sm text-[var(--color-text-muted)]">
        {label}
      </label>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />

      <div className="flex flex-col items-end gap-0.5">
        <div
          className="flex w-full items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium focus-within:border-[var(--color-accent)]"
          style={{
            borderColor: "var(--color-border-default)",
            background: "var(--color-bg)",
          }}
        >
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={shown}
            onChange={(e) => commit(e.target.value)}
            onFocus={(e) => {
              setDraft(String(Number(displayValue.toFixed(decimals))));
              e.currentTarget.select();
            }}
            onBlur={() => setDraft(null)}
            className="w-full min-w-0 bg-transparent text-right outline-none"
          />
          <span className="flex-shrink-0 text-[var(--color-text-muted)]">{unit}</span>
        </div>
        {hint && (
          <span className="text-[11px] text-[var(--color-text-muted)]">{hint}</span>
        )}
      </div>
    </div>
  );
}
