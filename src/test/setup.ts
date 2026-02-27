import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

import { invokeMock, openDialogMock, openUrlMock } from "./mocks/tauri";

if (
  typeof window !== "undefined" &&
  (!window.localStorage || typeof window.localStorage.getItem !== "function")
) {
  const storage: Record<string, string> = {};
  const localStorageMock: Storage = {
    get length() {
      return Object.keys(storage).length;
    },
    clear() {
      for (const key of Object.keys(storage)) {
        delete storage[key];
      }
    },
    getItem(key: string) {
      return storage[key] ?? null;
    },
    key(index: number) {
      return Object.keys(storage)[index] ?? null;
    },
    removeItem(key: string) {
      delete storage[key];
    },
    setItem(key: string, value: string) {
      storage[key] = value;
    },
  };

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
}

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  if (
    typeof window !== "undefined" &&
    window.localStorage &&
    typeof window.localStorage.clear === "function"
  ) {
    window.localStorage.clear();
  }
  invokeMock.mockClear();
  openDialogMock.mockClear();
  openUrlMock.mockClear();
});
