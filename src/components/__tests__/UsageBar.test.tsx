import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

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
