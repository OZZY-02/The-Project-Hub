"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Locale = "en" | "ar";

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = Record<string, TranslationValue>;

type I18nContextShape = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextShape | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const [translations, setTranslations] = useState<Translations | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("locale");
      if (saved === "ar" || saved === "en") {
        const frame = window.requestAnimationFrame(() => {
          setLocaleState(saved);
        });

        return () => window.cancelAnimationFrame(frame);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("locale", locale);
    // update document lang/dir for accessibility and RTL
    try {
      document.documentElement.lang = locale === "ar" ? "ar" : "en";
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    } catch {
      // ignore in non-browser contexts
    }

    let mounted = true;
    (async () => {
      try {
        // locales are stored in project root /locales
        const mod = await import(`../../locales/${locale}.json`);
        if (mounted) setTranslations(mod as unknown as Translations);
      } catch (err) {
        console.warn("Failed to load translations for", locale, err);
        if (mounted) setTranslations({});
      }
    })();

    return () => { mounted = false; };
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = useMemo(() => {
    return (key: string, fallback?: string) => {
      if (!translations) return fallback || key;
      const parts = key.split(".");
      let cur: TranslationValue | undefined = translations;
      for (const p of parts) {
        if (cur && typeof cur === "object" && Object.prototype.hasOwnProperty.call(cur, p)) {
          cur = cur[p];
        } else {
          return fallback || key;
        }
      }
      if (typeof cur === "string") return cur;
      return fallback || key;
    };
  }, [translations]);

  const value: I18nContextShape = { locale, setLocale, t };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}

export default I18nContext;
