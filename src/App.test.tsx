import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import App from "./App";
import { createUseAccountsMock } from "./test/mocks/useAccounts";

const useAccountsMock = vi.fn();

vi.mock("./hooks/useAccounts", () => ({
  useAccounts: () => useAccountsMock(),
}));

beforeEach(() => {
  useAccountsMock.mockReturnValue(createUseAccountsMock());
});

afterEach(() => {
  vi.useRealTimers();
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

it("clears refresh loading state when refresh fails", async () => {
  const refreshUsage = vi.fn(async () => {
    throw new Error("refresh failed");
  });
  useAccountsMock.mockReturnValue(
    createUseAccountsMock({
      refreshUsage,
    })
  );

  const user = userEvent.setup();
  render(<App />);

  const refreshButton = await screen.findByRole("button", {
    name: /refresh usage/i,
  });
  await user.click(refreshButton);

  expect(
    await screen.findByRole("button", { name: /refresh usage/i })
  ).toBeEnabled();
  expect(
    await screen.findByRole("status", { name: /global announcements/i })
  ).toHaveTextContent("Failed to refresh usage");
});

it("clears delete confirmation message after timeout", async () => {
  useAccountsMock.mockReturnValue(
    createUseAccountsMock({
      accounts: [
        {
          id: "acc-1",
          name: "Work",
          email: "work@example.com",
          plan_type: "plus",
          auth_mode: "chat_gpt",
          is_active: true,
          created_at: new Date().toISOString(),
          last_used_at: null,
        },
      ],
    })
  );

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /remove account/i }));
  expect(
    screen.getByText(/press delete again to confirm account removal/i, {
      selector: "div.fixed",
    })
  ).toBeInTheDocument();

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 3400));
  });

  expect(
    screen.queryByText(/press delete again to confirm account removal/i, {
      selector: "div.fixed",
    })
  ).not.toBeInTheDocument();
}, 10000);
