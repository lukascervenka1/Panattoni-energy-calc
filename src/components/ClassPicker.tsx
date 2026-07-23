"use client";

import type { CalculatorConfig, PenbClass } from "@/lib/types";

const CLASSES: PenbClass[] = ["A", "B", "C", "D", "E", "F", "G"];

const CLASS_COLORS: Record<PenbClass, string> = {
  A: "#16a34a",
  B: "#22c55e",
  C: "#84cc16",
  D: "#eab308",
  E: "#f97316",
  F: "#ef4444",
  G: "#991b1b",
};

const CLASS_TEXT_ON: Record<PenbClass, string> = {
  A: "#ffffff",
  B: "#071a0e",
  C: "#111111",
  D: "#111111",
  E: "#ffffff",
  F: "#ffffff",
  G: "#ffffff",
};

function boundaryLabel(config: CalculatorConfig, cls: PenbClass): string {
  const boundary = config.classBoundariesKwhM2[cls];
  if (boundary === null || boundary === undefined) return `>${config.classBoundariesKwhM2.F}`;
  return `≤${boundary}`;
}

export function ClassPicker({
  config,
  value,
  onChange,
}: {
  config: CalculatorConfig;
  value: PenbClass;
  onChange: (c: PenbClass) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {CLASSES.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-pressed={active}
            className="flex aspect-square min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border text-lg font-semibold transition-colors duration-150"
            style={{
              borderColor: active ? "transparent" : "var(--color-border-default)",
              background: active ? CLASS_COLORS[c] : "var(--color-surface)",
              color: active ? CLASS_TEXT_ON[c] : "var(--color-text)",
            }}
          >
            {c}
            <span
              className="font-mono text-[10px] font-normal opacity-70"
              style={{ fontFamily: "var(--font-mono, monospace)" }}
            >
              {boundaryLabel(config, c)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
