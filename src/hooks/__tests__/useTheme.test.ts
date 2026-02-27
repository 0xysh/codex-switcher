import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY, useTheme } from "../useTheme";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

it("persists selected theme preference", () => {
  const { result } = renderHook(() => useTheme());

  act(() => {
    result.current.setThemePreference("dark");
  });

  expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
});

it("uses system preference when preference is system", () => {
  window.localStorage.setItem(THEME_STORAGE_KEY, "system");
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    return {
      matches: query.includes("dark"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });

  const { result } = renderHook(() => useTheme());

  expect(result.current.resolvedTheme).toBe("dark");
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
});
