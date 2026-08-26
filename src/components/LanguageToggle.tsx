"use client";

import { useLocale } from "@/lib/LocaleContext";
import type { Locale } from "@/lib/i18n";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "cs", label: "CZ" },
  { value: "en", label: "EN" },
];

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-white/15 p-0.5"
      role="group"
      aria-label="Jazyk / Language"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === locale;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLocale(opt.value)}
            aria-pressed={active}
            // The pill stays visually compact to sit right next to the 20px
            // logo, but the button itself is a full 44px touch target; the
            // negative margin keeps that extra height out of the layout.
            className="-my-1.5 flex h-11 min-w-11 items-center justify-center"
          >
            <span
              className="flex h-8 w-full items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors duration-150"
              style={{
                background: active ? "#ffffff" : "transparent",
                color: active ? "var(--color-navy)" : "rgba(255,255,255,0.6)",
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
