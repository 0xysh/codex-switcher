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

it("falls back to defaults for malformed storage json", () => {
  window.localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, "{bad-json");

  const { result } = renderHook(() => useUiPreferences());

  expect(result.current.maskedAccountIds).toEqual([]);
});
