import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";

import {
  UI_PREFERENCES_STORAGE_KEY,
  useUiPreferences,
} from "../useUiPreferences";

beforeEach(() => {
  if (window.localStorage && typeof window.localStorage.clear === "function") {
    window.localStorage.clear();
  }
});

it("safely persists masked account ids to localStorage", () => {
  const { result } = renderHook(() => useUiPreferences());

  act(() => {
    result.current.setMaskedAccountIds(["acc-1"]);
  });

  expect(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY)).toContain(
    "acc-1"
  );
});

it("defaults card density to full and persists compact mode", () => {
  const { result } = renderHook(() => useUiPreferences());

  expect(result.current.cardDensityMode).toBe("full");

  act(() => {
    result.current.setCardDensityMode("compact");
  });

  expect(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY)).toContain(
    '"cardDensityMode":"compact"'
  );
});

it("preserves masked ids from legacy storage payloads without card density", () => {
  window.localStorage.setItem(
    UI_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ maskedAccountIds: ["acc-legacy"] })
  );

  const { result } = renderHook(() => useUiPreferences());

  expect(result.current.maskedAccountIds).toEqual(["acc-legacy"]);
  expect(result.current.cardDensityMode).toBe("full");
});

it("keeps masked ids when toggling card density mode", () => {
  window.localStorage.setItem(
    UI_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ maskedAccountIds: ["acc-legacy"] })
  );

  const { result } = renderHook(() => useUiPreferences());

  act(() => {
    result.current.setCardDensityMode("compact");
  });

  expect(result.current.maskedAccountIds).toEqual(["acc-legacy"]);
  expect(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY)).toContain(
    '"maskedAccountIds":["acc-legacy"]'
  );
});

it("falls back to defaults for malformed storage json", () => {
  window.localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, "{bad-json");

  const { result } = renderHook(() => useUiPreferences());

  expect(result.current.maskedAccountIds).toEqual([]);
  expect(result.current.cardDensityMode).toBe("full");
});
