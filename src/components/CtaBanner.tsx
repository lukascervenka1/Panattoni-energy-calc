"use client";

import { useState } from "react";
import { useLocale } from "@/lib/LocaleContext";
import { Glow } from "./Glow";
import { ContactModal } from "./ContactModal";

export function CtaBanner() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-[var(--color-navy)] p-6 text-center sm:p-8">
        <Glow />
        <div className="relative flex flex-col items-center gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              {t.cta.title}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/70 sm:text-base">
              {t.cta.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-11 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--color-navy)] transition-transform duration-150 hover:scale-[1.03]"
          >
            {t.cta.button}
          </button>
        </div>
      </div>
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
