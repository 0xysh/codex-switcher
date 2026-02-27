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
