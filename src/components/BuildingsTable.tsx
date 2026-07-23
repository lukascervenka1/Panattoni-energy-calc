"use client";

import { useState } from "react";
import type { Building, PenbClass } from "@/lib/types";
import { formatNumber } from "@/lib/calc";

const CLASS_BADGE: Record<PenbClass, string> = {
  A: "bg-[#16a34a] text-white",
  B: "bg-[#22c55e] text-[#071a0e]",
  C: "bg-[#84cc16] text-[#111]",
  D: "bg-[#eab308] text-[#111]",
  E: "bg-[#f97316] text-white",
  F: "bg-[#ef4444] text-white",
  G: "bg-[#991b1b] text-white",
};

export function BuildingsTable({
  buildings,
  highlightClass,
}: {
  buildings: Building[];
  highlightClass: PenbClass;
}) {
  const [open, setOpen] = useState(false);
  const sorted = [...buildings].sort((a, b) => a.pneKwhM2 - b.pneKwhM2);

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-h-11 items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">
          Srovnatelné haly v portfoliu Panattoni ({buildings.length})
        </span>
        <span className="text-[var(--color-text-muted)]">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border-default)" }}>
                <th className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Park / typologie
                </th>
                <th className="px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Třída
                </th>
                <th className="px-2 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  kWh/m²
                </th>
                <th className="px-2 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Plocha m²
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => {
                const hi = b.penbClass === highlightClass;
                return (
                  <tr
                    key={b.id}
                    className="border-b last:border-none"
                    style={{
                      borderColor: "var(--color-border-default)",
                      background: hi ? "var(--color-accent-soft)" : undefined,
                    }}
                  >
                    <td className="px-2 py-2">
                      {b.park ?? b.category}
                      <br />
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {b.category}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {b.penbClass ? (
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${CLASS_BADGE[b.penbClass]}`}
                        >
                          {b.penbClass}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right font-medium">
                      {formatNumber(b.pneKwhM2)}
                    </td>
                    <td className="px-2 py-2 text-right text-[var(--color-text-muted)]">
                      {formatNumber(b.areaM2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            Anonymizovaná data z interního portfolia Panattoni (naměřená spotřeba 2023–2024).
            Jména nájemců a SPV nejsou zobrazena.
          </p>
        </div>
      )}
    </div>
  );
}
