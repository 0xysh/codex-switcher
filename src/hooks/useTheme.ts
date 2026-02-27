import { useCallback, useEffect, useMemo, useState } from "react";

import {
  applyRandomTheme,
  buildRandomTheme,
  clearRandomThemeOverrides,
  RANDOM_THEME_STORAGE_KEY,
  readStoredRandomTheme,
  type RandomThemePalette,
  type ResolvedTheme,
} from "./themeRandomizer";

export type ThemePreference = "light" | "dark" | "system";
export type { ResolvedTheme };

export const THEME_STORAGE_KEY = "codex-switcher:theme";

function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined" || !window.localStorage) {
    return "system";
  }

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

function applyFixedTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => readStoredTheme());
  const [randomTheme, setRandomTheme] = useState<RandomThemePalette | null>(() => readStoredRandomTheme());

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (themePreference === "system") {
      return randomTheme?.baseTheme ?? "light";
    }

    return themePreference;
  }, [themePreference, randomTheme]);

  const setThemePreference = useCallback((theme: ThemePreference) => {
    if (theme === "system") {
      setThemePreferenceState("system");
      setRandomTheme(buildRandomTheme());
      return;
    }

    setThemePreferenceState(theme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [themePreference]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage || !randomTheme) {
      return;
    }

    window.localStorage.setItem(RANDOM_THEME_STORAGE_KEY, JSON.stringify(randomTheme));
  }, [randomTheme]);

  useEffect(() => {
    if (themePreference === "system") {
      const activeTheme = randomTheme ?? buildRandomTheme();
      if (!randomTheme) {
        setRandomTheme(activeTheme);
      }
      applyRandomTheme(activeTheme);
      return;
    }

    clearRandomThemeOverrides();
    applyFixedTheme(resolvedTheme);
  }, [randomTheme, resolvedTheme, themePreference]);

  return {
    themePreference,
    resolvedTheme,
    setThemePreference,
  };
}
