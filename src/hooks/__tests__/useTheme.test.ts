import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";

import {
  buildRandomTheme,
  RANDOM_THEME_STORAGE_KEY,
} from "../themeRandomizer";
import { THEME_STORAGE_KEY, useTheme } from "../useTheme";

function contrastRatio(first: string, second: string): number {
  const toLuminance = (hex: string) => {
    const normalized = hex.replace("#", "");
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    const toLinear = (channel: number) => {
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const lighter = Math.max(toLuminance(first), toLuminance(second));
  const darker = Math.min(toLuminance(first), toLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToHue(hex: string): number {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  if (max === r) {
    const segment = (g - b) / delta;
    const hue = 60 * (segment % 6);
    return hue < 0 ? hue + 360 : hue;
  }

  if (max === g) {
    return 60 * ((b - r) / delta + 2);
  }

  return 60 * ((r - g) / delta + 4);
}

function isPinkHue(hue: number): boolean {
  return hue >= 300 || hue <= 16;
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("style");
});

it("persists selected fixed theme preference", () => {
  const { result } = renderHook(() => useTheme());

  act(() => {
    result.current.setThemePreference("dark");
  });

  expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
});

it("generates and persists a random palette when random mode is selected", async () => {
  const { result } = renderHook(() => useTheme());

  act(() => {
    result.current.setThemePreference("system");
  });

  await waitFor(() => {
    expect(window.localStorage.getItem(RANDOM_THEME_STORAGE_KEY)).not.toBeNull();
  });

  const stored = JSON.parse(window.localStorage.getItem(RANDOM_THEME_STORAGE_KEY) ?? "{}");
  expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  expect(stored.baseTheme === "light" || stored.baseTheme === "dark").toBe(true);
  expect(document.documentElement.getAttribute("data-theme")).toBe(stored.baseTheme);
  expect(document.documentElement.style.getPropertyValue("--accent-primary")).not.toBe("");
});

it("restores persisted random palette on app reload", () => {
  const palette = buildRandomTheme();
  window.localStorage.setItem(THEME_STORAGE_KEY, "system");
  window.localStorage.setItem(RANDOM_THEME_STORAGE_KEY, JSON.stringify(palette));

  renderHook(() => useTheme());

  expect(document.documentElement.getAttribute("data-theme")).toBe(palette.baseTheme);
  expect(document.documentElement.style.getPropertyValue("--accent-primary")).toBe(
    palette.tokens["--accent-primary"],
  );
});

it("builds random accent themes with readable CTA foreground", () => {
  for (let index = 0; index < 32; index += 1) {
    const palette = buildRandomTheme();
    const foreground = palette.tokens["--accent-foreground"];
    const accentPrimaryHue = hexToHue(palette.tokens["--accent-primary"]);
    const accentSecondaryHue = hexToHue(palette.tokens["--accent-secondary"]);
    const primaryContrast = contrastRatio(foreground, palette.tokens["--accent-primary"]);
    const secondaryContrast = contrastRatio(foreground, palette.tokens["--accent-secondary"]);

    expect(isPinkHue(accentPrimaryHue)).toBe(false);
    expect(isPinkHue(accentSecondaryHue)).toBe(false);
    expect(Math.min(primaryContrast, secondaryContrast)).toBeGreaterThanOrEqual(4.5);
  }
});
