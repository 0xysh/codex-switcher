import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import type { AccountWithUsage } from "../../types";
import { QuickSwitchDialog } from "../QuickSwitchDialog";

function createAccount(overrides: Partial<AccountWithUsage>): AccountWithUsage {
  return {
    id: "acc-default",
    name: "Default",
    email: "default@example.com",
    plan_type: "plus",
    auth_mode: "chat_gpt",
    is_active: false,
    created_at: new Date().toISOString(),
    last_used_at: null,
    ...overrides,
  };
}

it("supports keyboard navigation and enter-to-switch", async () => {
  const user = userEvent.setup();
  const onSwitch = vi.fn(async () => {});

  render(
    <QuickSwitchDialog
      isOpen
      query=""
      accounts={[
        createAccount({ id: "acc-1", name: "Alpha" }),
        createAccount({ id: "acc-2", name: "Bravo" }),
        createAccount({ id: "acc-3", name: "Charlie" }),
      ]}
      switchingId={null}
      onQueryChange={vi.fn()}
      onClose={vi.fn()}
      onSwitch={onSwitch}
    />,
  );

  const input = screen.getByPlaceholderText(/search account name or email/i);
  await user.click(input);
  await user.keyboard("{ArrowDown}{Enter}");

  expect(onSwitch).toHaveBeenCalledTimes(1);
  expect(onSwitch).toHaveBeenCalledWith("acc-2");
});

it("wraps keyboard selection when navigating upward", async () => {
  const user = userEvent.setup();
  const onSwitch = vi.fn(async () => {});

  render(
    <QuickSwitchDialog
      isOpen
      query=""
      accounts={[
        createAccount({ id: "acc-1", name: "Alpha" }),
        createAccount({ id: "acc-2", name: "Bravo" }),
        createAccount({ id: "acc-3", name: "Charlie" }),
      ]}
      switchingId={null}
      onQueryChange={vi.fn()}
      onClose={vi.fn()}
      onSwitch={onSwitch}
    />,
  );

  const input = screen.getByPlaceholderText(/search account name or email/i);
  await user.click(input);
  await user.keyboard("{ArrowUp}{Enter}");

  expect(onSwitch).toHaveBeenCalledTimes(1);
  expect(onSwitch).toHaveBeenCalledWith("acc-3");
});
