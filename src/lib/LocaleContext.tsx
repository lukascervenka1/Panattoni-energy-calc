"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { type Locale, type Translations, translations } from "./i18n";

const STORAGE_KEY = "panattoni-calc-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Locale {
  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "cs";
}

function getServerSnapshot(): Locale {
  return "cs";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Reads the persisted choice without desyncing server/client markup on first paint.
  const storedLocale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [override, setOverride] = useState<Locale | null>(null);
  const locale = override ?? storedLocale;

  useEffect(() => {
    // Only the lang attribute is synced here — Next's App Router metadata
    // owns the <title> element via React's built-in title hoisting, and a
    // plain `document.title = ...` mutation gets silently overwritten by
    // its reconciliation on the next render pass.
    document.documentElement.lang = translations[locale].htmlLang;
  }, [locale]);

  function setLocale(next: Locale) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setOverride(next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
