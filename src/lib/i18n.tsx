"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Locale = "en" | "ar";

type Translations = Record<string, any>;

type I18nContextShape = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextShape | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("locale") : null;
      if (saved === "ar") return "ar";
    } catch (e) {
      /* ignore */
    }
    return "en";
  });

  const [translations, setTranslations] = useState<Translations | null>(null);

  useEffect(() => {
    window.localStorage.setItem("locale", locale);
    // update document lang/dir for accessibility and RTL
    try {
      document.documentElement.lang = locale === "ar" ? "ar" : "en";
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    } catch (e) {
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
      let cur: any = translations;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
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
