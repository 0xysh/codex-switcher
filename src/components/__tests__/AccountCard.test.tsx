import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { AccountCard } from "../AccountCard";

it("exposes labeled icon controls and keyboard-safe rename trigger", () => {
  render(
    <AccountCard
      account={{
        id: "acc-1",
        name: "Work",
        email: "work@example.com",
        plan_type: "plus",
        auth_mode: "chat_gpt",
        is_active: false,
        created_at: new Date().toISOString(),
        last_used_at: null,
      }}
      onSwitch={() => {}}
      onDelete={() => {}}
      onRefresh={async () => {}}
      onRename={async () => {}}
      onToggleMask={() => {}}
    />
  );

  expect(
    screen.getByRole("button", { name: /rename account/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /refresh usage/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /remove account/i })
  ).toBeInTheDocument();
});
