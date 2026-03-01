import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import App from "./App";
import type { CurrentAuthSummary } from "./types";
import { createUseAccountsMock } from "./test/mocks/useAccounts";
import { invokeMock } from "./test/mocks/tauri";

const useAccountsMock = vi.fn();

const WORK_ACCOUNT = {
  id: "acc-work",
  name: "Work",
  email: "work@example.com",
  plan_type: "plus" as const,
  auth_mode: "chat_gpt" as const,
  is_active: true,
  created_at: new Date().toISOString(),
  last_used_at: null,
};

const PERSONAL_ACCOUNT = {
  id: "acc-personal",
  name: "Personal",
  email: "personal@example.com",
  plan_type: "plus" as const,
  auth_mode: "chat_gpt" as const,
  is_active: false,
  created_at: new Date().toISOString(),
  last_used_at: null,
};

vi.mock("./hooks/useAccounts", () => ({
  useAccounts: () => useAccountsMock(),
}));

beforeEach(() => {
  window.localStorage.clear();

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

it("renders control rail as three top actions and three theme options", async () => {
  render(<App />);

  const controlRail = (await screen.findByText(/control rail/i)).closest("aside");
  expect(controlRail).not.toBeNull();

  const scoped = within(controlRail!);

  expect(scoped.getByRole("button", { name: /refresh usage/i })).toBeInTheDocument();
  expect(scoped.getByRole("button", { name: /add account/i })).toBeInTheDocument();
  expect(scoped.getByRole("button", { name: /compact view/i })).toBeInTheDocument();

  expect(scoped.getByRole("radio", { name: /light/i })).toBeInTheDocument();
  expect(scoped.getByRole("radio", { name: /dark/i })).toBeInTheDocument();
  expect(scoped.getByRole("radio", { name: /random/i })).toBeInTheDocument();
  expect(
    scoped.getByRole("button", { name: /show random palette details/i })
  ).toBeInTheDocument();
  expect(scoped.getByText(/accounts tracked/i)).toBeInTheDocument();
  expect(scoped.getByText(/blocking pids/i)).toBeInTheDocument();
});

it("opens palette modal from random info action and copies active palette", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn(async () => undefined);

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  render(<App />);

  await user.click(
    await screen.findByRole("button", { name: /show random palette details/i })
  );

  expect(
    await screen.findByRole("dialog", { name: /current theme palette/i })
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /copy palette/i }));

  expect(writeText).toHaveBeenCalledWith(
    expect.stringContaining("--accent-primary")
  );
  expect(
    screen.getByRole("status", { name: /theme palette status/i })
  ).toHaveTextContent(/palette copied/i);
});

it("toggles compact/full button label when density mode changes", async () => {
  const user = userEvent.setup();
  render(<App />);

  const compactButton = await screen.findByRole("button", { name: /compact view/i });
  await user.click(compactButton);

  expect(await screen.findByRole("button", { name: /full view/i })).toBeInTheDocument();
});

it("switches to compact mode and hides card management controls", async () => {
  useAccountsMock.mockReturnValue(
    createUseAccountsMock({
      accounts: [WORK_ACCOUNT],
    })
  );

  const user = userEvent.setup();
  render(<App />);

  expect(await screen.findByRole("button", { name: /reconnect/i })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: /remove account/i })).toBeInTheDocument();

  await user.click(await screen.findByRole("button", { name: /compact view/i }));
  expect(await screen.findByRole("button", { name: /full view/i })).toBeInTheDocument();

  expect(screen.queryByRole("button", { name: /reconnect/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /remove account/i })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /refresh work usage/i })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /refresh usage/i })).toHaveLength(1);
});

it("keeps reorder handles available in compact mode for multiple accounts", async () => {
  useAccountsMock.mockReturnValue(
    createUseAccountsMock({
      accounts: [WORK_ACCOUNT, PERSONAL_ACCOUNT],
    })
  );

  const user = userEvent.setup();
  render(<App />);

  expect(await screen.findByRole("button", { name: /reorder work/i })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: /reorder personal/i })).toBeInTheDocument();

  await user.click(await screen.findByRole("button", { name: /compact view/i }));
  expect(await screen.findByRole("button", { name: /full view/i })).toBeInTheDocument();

  expect(screen.getByRole("button", { name: /reorder work/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /reorder personal/i })).toBeInTheDocument();
});

it("keeps recent activity and blocking pid status visible", async () => {
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
  expect(await screen.findByText(/blocking pids/i)).toBeInTheDocument();
  expect(await screen.findByText(/^111, 222$/)).toBeInTheDocument();
});
