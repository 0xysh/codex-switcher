import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";

import {
  buildRandomTheme,
  RANDOM_THEME_STORAGE_KEY,
} from "../themeRandomizer";
import { THEME_STORAGE_KEY, useTheme } from "../useTheme";

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
