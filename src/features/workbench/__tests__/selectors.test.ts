import { describe, expect, it } from "vitest";

import type { AccountWithUsage } from "../../../types";
import {
  getRelativeTime,
  needsAttention,
  summarizeAccounts,
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

describe("summarizeAccounts", () => {
  it("returns account totals for usage-first header chips", () => {
    const accounts: AccountWithUsage[] = [
      createAccount({
        id: "oauth-attention",
        auth_mode: "chat_gpt",
        usage: {
          account_id: "oauth-attention",
          plan_type: "plus",
          primary_used_percent: 92,
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
      createAccount({ id: "oauth-healthy", auth_mode: "chat_gpt" }),
      createAccount({ id: "imported", auth_mode: "api_key" }),
    ];

    expect(summarizeAccounts(accounts)).toEqual({
      total: 3,
      attention: 1,
      oauth: 2,
      imported: 1,
    });
  });
});

describe("getRelativeTime", () => {
  it("formats recent times with second precision", () => {
    const now = new Date("2026-02-27T00:00:10.000Z").getTime();
    const timestamp = new Date("2026-02-27T00:00:00.000Z").getTime();

    expect(getRelativeTime(timestamp, now)).toBe("10s ago");
  });
});
