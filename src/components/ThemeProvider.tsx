"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

let fallbackTheme: Theme | null = null;

function getThemeSnapshot(): Theme {
  try {
    const stored = localStorage.getItem("ypp-theme");
    if (stored === "dark" || stored === "light") return stored;
    if (fallbackTheme) return fallbackTheme;
  } catch {
    if (fallbackTheme) return fallbackTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToTheme(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("ypp-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("ypp-theme-change", onChange);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = getThemeSnapshot() === "light" ? "dark" : "light";
    fallbackTheme = next;
    try {
      localStorage.setItem("ypp-theme", next);
    } catch {
      fallbackTheme = next;
    }
    window.dispatchEvent(new Event("ypp-theme-change"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  return useContext(ThemeContext);
}
