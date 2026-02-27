import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import App from "./App";
import { createUseAccountsMock } from "./test/mocks/useAccounts";

const useAccountsMock = vi.fn();

vi.mock("./hooks/useAccounts", () => ({
  useAccounts: () => useAccountsMock(),
}));

beforeEach(() => {
  useAccountsMock.mockReturnValue(createUseAccountsMock());
});

it("renders app title", async () => {
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Codex Switcher" })
  ).toBeInTheDocument();
});

it("provides a skip link and polite live region", async () => {
  render(<App />);

  expect(
    await screen.findByRole("link", { name: /skip to main content/i })
  ).toBeInTheDocument();

  expect(
    await screen.findByRole("status", { name: /global announcements/i })
  ).toHaveAttribute("aria-live", "polite");
});
