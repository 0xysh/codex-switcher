import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { UsageBar } from "../UsageBar";

it("renders usage numbers with tabular-nums", () => {
  render(
    <UsageBar
      usage={{
        account_id: "acc-1",
        plan_type: "plus",
        primary_used_percent: 40,
        primary_window_minutes: 300,
        primary_resets_at: Math.floor(Date.now() / 1000) + 3600,
        secondary_used_percent: null,
        secondary_window_minutes: null,
        secondary_resets_at: null,
        has_credits: null,
        unlimited_credits: null,
        credits_balance: null,
        error: null,
      }}
    />
  );

  expect(screen.getByText(/% left/i)).toHaveClass("tabular-nums");
});

it("does not render credits balance in usage section", () => {
  render(
    <UsageBar
      usage={{
        account_id: "acc-2",
        plan_type: "plus",
        primary_used_percent: 40,
        primary_window_minutes: 300,
        primary_resets_at: Math.floor(Date.now() / 1000) + 3600,
        secondary_used_percent: null,
        secondary_window_minutes: null,
        secondary_resets_at: null,
        has_credits: true,
        unlimited_credits: false,
        credits_balance: "42.50",
        error: null,
      }}
    />
  );

  expect(screen.queryByText(/credits:/i)).not.toBeInTheDocument();
});

it("formats long reset windows with day-hour shorthand", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

  try {
    render(
      <UsageBar
        usage={{
          account_id: "acc-3",
          plan_type: "plus",
          primary_used_percent: null,
          primary_window_minutes: null,
          primary_resets_at: null,
          secondary_used_percent: 36,
          secondary_window_minutes: 10080,
          secondary_resets_at: Math.floor(Date.now() / 1000) + 51 * 3600 + 22 * 60,
          has_credits: null,
          unlimited_credits: null,
          credits_balance: null,
          error: null,
        }}
      />
    );

    expect(screen.getByText(/resets in 2d 3h/i)).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
