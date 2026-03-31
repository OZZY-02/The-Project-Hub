"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextShape = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextShape | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const nextTheme =
      window.localStorage.getItem("theme") === "light" || window.localStorage.getItem("theme") === "dark"
        ? (window.localStorage.getItem("theme") as Theme)
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";

    const frame = window.requestAnimationFrame(() => {
      setThemeState(nextTheme);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme !== theme) {
      window.localStorage.setItem("theme", theme);
    }
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo<ThemeContextShape>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((currentTheme) => (currentTheme === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
