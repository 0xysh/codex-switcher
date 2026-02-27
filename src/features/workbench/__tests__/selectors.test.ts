import { describe, expect, it } from "vitest";

import type { AccountWithUsage, CodexProcessInfo } from "../../../types";
import {
  filterAndSortAccounts,
  getRelativeTime,
  needsAttention,
  summarizeSafety,
} from "../selectors";

function createAccount(overrides: Partial<AccountWithUsage>): AccountWithUsage {
  return {
    id: "acc-default",
    name: "Default",
    email: "default@example.com",
    plan_type: "plus",
    auth_mode: "chat_gpt",
    is_active: false,
    created_at: "2026-01-01T00:00:00.000Z",
    last_used_at: null,
    ...overrides,
  };
}

describe("needsAttention", () => {
  it("returns true when usage contains an error", () => {
    const account = createAccount({
      usage: {
        account_id: "acc-1",
        plan_type: "plus",
        primary_used_percent: null,
        primary_window_minutes: null,
        primary_resets_at: null,
        secondary_used_percent: null,
        secondary_window_minutes: null,
        secondary_resets_at: null,
        has_credits: null,
        unlimited_credits: null,
        credits_balance: null,
        error: "request failed",
      },
    });

    expect(needsAttention(account)).toBe(true);
  });

  it("returns true when remaining usage is low", () => {
    const account = createAccount({
      usage: {
        account_id: "acc-2",
        plan_type: "plus",
        primary_used_percent: 90,
        primary_window_minutes: null,
        primary_resets_at: null,
        secondary_used_percent: null,
        secondary_window_minutes: null,
        secondary_resets_at: null,
        has_credits: null,
        unlimited_credits: null,
        credits_balance: null,
        error: null,
      },
    });

    expect(needsAttention(account)).toBe(true);
  });
});

describe("filterAndSortAccounts", () => {
  it("keeps active account first while sorting remaining by usage pressure", () => {
    const accounts: AccountWithUsage[] = [
      createAccount({
        id: "active",
        name: "Active",
        is_active: true,
        usage: {
          account_id: "active",
          plan_type: "plus",
          primary_used_percent: 40,
          primary_window_minutes: null,
          primary_resets_at: null,
          secondary_used_percent: null,
          secondary_window_minutes: null,
          secondary_resets_at: null,
          has_credits: null,
          unlimited_credits: null,
          credits_balance: null,
          error: null,
        },
      }),
      createAccount({
        id: "high",
        name: "High",
        usage: {
          account_id: "high",
          plan_type: "plus",
          primary_used_percent: 95,
          primary_window_minutes: null,
          primary_resets_at: null,
          secondary_used_percent: null,
          secondary_window_minutes: null,
          secondary_resets_at: null,
          has_credits: null,
          unlimited_credits: null,
          credits_balance: null,
          error: null,
        },
      }),
      createAccount({
        id: "healthy",
        name: "Healthy",
        usage: {
          account_id: "healthy",
          plan_type: "plus",
          primary_used_percent: 20,
          primary_window_minutes: null,
          primary_resets_at: null,
          secondary_used_percent: null,
          secondary_window_minutes: null,
          secondary_resets_at: null,
          has_credits: null,
          unlimited_credits: null,
          credits_balance: null,
          error: null,
        },
      }),
    ];

    const result = filterAndSortAccounts({
      accounts,
      query: "",
      filter: "all",
      sort: "usage",
    });

    expect(result.map((account) => account.id)).toEqual(["active", "high", "healthy"]);
  });
});

describe("summarizeSafety", () => {
  it("returns warning tone when codex process count is non-zero", () => {
    const processInfo: CodexProcessInfo = {
      count: 2,
      can_switch: false,
      pids: [111, 222],
    };

    const summary = summarizeSafety(processInfo);

    expect(summary.title).toBe("Switching locked");
    expect(summary.tone).toBe("chip chip-warning");
  });
});

describe("getRelativeTime", () => {
  it("formats recent times with second precision", () => {
    const now = new Date("2026-02-27T00:00:10.000Z").getTime();
    const timestamp = new Date("2026-02-27T00:00:00.000Z").getTime();

    expect(getRelativeTime(timestamp, now)).toBe("10s ago");
  });
});
