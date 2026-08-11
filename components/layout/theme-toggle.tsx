"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type ResolvedTheme = "light" | "dark";

const themeStorageKey = "finpilot-theme";
const themeChangeEvent = "finpilot:theme-change";
const darkThemeQuery = "(prefers-color-scheme: dark)";
let transientTheme: ResolvedTheme | null = null;

function getSavedTheme(): ResolvedTheme | null {
  if (typeof window === "undefined") return null;

  try {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    return savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : transientTheme;
  } catch {
    return transientTheme;
  }
}

function getResolvedTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";

  return (
    getSavedTheme() ??
    (window.matchMedia(darkThemeQuery).matches ? "dark" : "light")
  );
}

function applyThemePreference() {
  const savedTheme = getSavedTheme();
  const root = document.documentElement;

  root.classList.toggle("light", savedTheme === "light");
  root.classList.toggle("dark", savedTheme === "dark");
  root.style.colorScheme = getResolvedTheme();
}

function subscribeToTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(darkThemeQuery);

  const handleSystemThemeChange = () => {
    if (getSavedTheme() === null) {
      applyThemePreference();
      onStoreChange();
    }
  };
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === null || event.key === themeStorageKey) {
      applyThemePreference();
      onStoreChange();
    }
  };
  const handleLocalThemeChange = () => {
    applyThemePreference();
    onStoreChange();
  };

  applyThemePreference();
  mediaQuery.addEventListener("change", handleSystemThemeChange);
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(themeChangeEvent, handleLocalThemeChange);

  return () => {
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(themeChangeEvent, handleLocalThemeChange);
  };
}

function setTheme(theme: ResolvedTheme) {
  transientTheme = theme;

  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Keep the preference in memory when browser storage is unavailable.
  }

  applyThemePreference();
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeToggle() {
  const resolvedTheme = useSyncExternalStore(
    subscribeToTheme,
    getResolvedTheme,
    () => "light",
  );
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Use light theme" : "Use dark theme"}
      title={isDark ? "Use light theme" : "Use dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </Button>
  );
}
