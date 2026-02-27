import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

import { invokeMock, openDialogMock, openUrlMock } from "./mocks/tauri";

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
