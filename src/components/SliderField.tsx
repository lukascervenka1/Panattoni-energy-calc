"use client";

import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { clampToRange, formatForLocale, parseTyped } from "@/lib/numberInput";

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
    onChange(clampToRange(canonical, min, max));
  }

  return (
    // The value box sits in its own explicit grid row (row 1, col 3) so its
    // height alone — not the hint line below it — decides where `items-center`
    // vertically centers the label and slider. Otherwise a field with a hint
    // ends up centered against the taller box+hint stack, and its input box
    // sits visibly higher than a hint-less field's (compare "Pronajatá
    // plocha", no hint, against the two fields below it).
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[150px_1fr_150px] sm:gap-x-3 sm:gap-y-1">
      <label
        htmlFor={id}
        className="text-sm text-[var(--color-text-muted)] sm:col-start-1 sm:row-start-1"
      >
        {label}
      </label>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clampToRange(Number(e.target.value), min, max))}
        aria-label={label}
        className="sm:col-start-2 sm:row-start-1"
      />

      <div
        className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium focus-within:border-[var(--color-accent)] sm:col-start-3 sm:row-start-1"
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
        <span className="text-right text-[11px] text-[var(--color-text-muted)] sm:col-start-3 sm:row-start-2">
          {hint}
        </span>
      )}
    </div>
  );
}
