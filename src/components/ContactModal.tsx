"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/LocaleContext";
import { Logo } from "./Logo";
import { Glow } from "./Glow";
import { ArrowRightIcon, CloseIcon } from "./icons";

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();

  useEffect(() => {
    if (!open) return;

    // Locking scroll via `overflow: hidden` alone leaves the page's scroll
    // offset in place, which on mobile browsers lets the address bar
    // collapse/expand mid-interaction and desyncs the fixed overlay's
    // layout box from where touches actually land. Pinning `body` to the
    // current scroll position avoids that.
    const scrollY = window.scrollY;
    const body = document.body.style;
    const previous = { position: body.position, top: body.top, width: body.width };
    body.position = "fixed";
    body.top = `-${scrollY}px`;
    body.width = "100%";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      body.position = previous.position;
      body.top = previous.top;
      body.width = previous.width;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-navy)]/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-rise-in relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-navy)] p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <Glow />
        <button
          type="button"
          onClick={onClose}
          aria-label={t.modal.close}
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="relative">
          <Logo height={18} />
          <h2
            id="contact-modal-title"
            className="mt-6 font-heading text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl"
          >
            {t.modal.title}
          </h2>
          <p className="mt-2 text-sm text-white/70">{t.cta.subtitle}</p>

          <div className="mt-6 flex flex-col gap-3">
            <a
              href="mailto:czinfo@panattoni.com"
              className="group flex items-center justify-between rounded-xl bg-white/10 px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              czinfo@panattoni.com
              <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="tel:+420226220550"
              className="group flex items-center justify-between rounded-xl bg-white/10 px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              +420 226 220 550
              <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
