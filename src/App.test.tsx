import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import App from "./App";
import type { CurrentAuthSummary } from "./types";
import { createUseAccountsMock } from "./test/mocks/useAccounts";
import { invokeMock } from "./test/mocks/tauri";

const useAccountsMock = vi.fn();

vi.mock("./hooks/useAccounts", () => ({
  useAccounts: () => useAccountsMock(),
}));

beforeEach(() => {
  useAccountsMock.mockReturnValue(createUseAccountsMock());
  invokeMock.mockImplementation(async (command: string) => {
    if (command === "check_codex_processes") {
      return {
        count: 0,
        can_switch: true,
        pids: [],
      };
    }

    if (command === "list_accounts" || command === "refresh_all_accounts_usage") {
      return [];
    }

    return null;
  });
});

afterEach(() => {
  vi.useRealTimers();
});

it("renders app title", async () => {
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Codex Usage Inspector" })
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

it("refreshes current session before opening snapshot import modal", async () => {
  const refreshedSummary: CurrentAuthSummary = {
    status: "ready",
    auth_mode: "chat_gpt",
    email: "session@example.com",
    plan_type: "plus",
    auth_file_path: "/Users/test/.codex/auth.json",
    snapshots_dir_path: "/Users/test/.codex-switcher/snapshots",
    last_modified_at: null,
    message: null,
  };

  const refreshCurrentSession = vi.fn(async () => refreshedSummary);

  useAccountsMock.mockReturnValue(
    createUseAccountsMock({
      refreshCurrentSession,
    })
  );

  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /import snapshot/i }));

  expect(refreshCurrentSession).toHaveBeenCalled();
  expect(await screen.findByRole("dialog", { name: /add a new account/i })).toBeInTheDocument();
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

it("removes inspector, shortcuts, quick switch, and search UI", async () => {
  render(<App />);

  expect(screen.queryByText(/^inspector$/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/shortcuts/i)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /quick switch/i })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByPlaceholderText(/search account name or email/i)
  ).not.toBeInTheDocument();
});

it("keeps recent activity and process pid status visible", async () => {
  invokeMock.mockImplementation(async (command: string) => {
    if (command === "check_codex_processes") {
      return {
        count: 2,
        can_switch: false,
        pids: [111, 222],
      };
    }

    if (command === "list_accounts" || command === "refresh_all_accounts_usage") {
      return [];
    }

    return null;
  });

  render(<App />);

  expect(await screen.findByText(/recent activity/i)).toBeInTheDocument();
  expect(await screen.findByText(/2 processes running/i)).toBeInTheDocument();
  expect(await screen.findByText(/blocking pids/i)).toBeInTheDocument();
  expect(await screen.findByText(/^111, 222$/)).toBeInTheDocument();
});
