import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";

import { AccountCard } from "../AccountCard";

it("uses the same controls layout for active and inactive cards without switch CTAs", () => {
  render(
    <div>
      <AccountCard
        account={{
          id: "acc-1",
          name: "Work",
          email: "work@example.com",
          plan_type: "plus",
          auth_mode: "chat_gpt",
          is_active: true,
          created_at: new Date().toISOString(),
          last_used_at: null,
        }}
        onDelete={() => {}}
        onRefresh={async () => {}}
        onReconnect={async () => {}}
        onRename={async () => {}}
      />

      <AccountCard
        account={{
          id: "acc-2",
          name: "Personal",
          email: "personal@example.com",
          plan_type: "plus",
          auth_mode: "chat_gpt",
          is_active: false,
          created_at: new Date().toISOString(),
          last_used_at: null,
        }}
        onDelete={() => {}}
        onRefresh={async () => {}}
        onReconnect={async () => {}}
        onRename={async () => {}}
      />
    </div>
  );

  const cards = screen.getAllByRole("article");
  expect(cards).toHaveLength(2);

  cards.forEach((card) => {
    expect(within(card).getByRole("button", { name: /rename account/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /refresh usage/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /reconnect/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /remove account/i })).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: /toggle account visibility/i })).not.toBeInTheDocument();
    expect(within(card).queryByText(/switch now/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/active now/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/last updated/i)).not.toBeInTheDocument();
    expect(within(card).getByText(/updated never/i)).toBeInTheDocument();
  });
});

it("shows credits beside account identity when credits balance exists", () => {
  render(
    <AccountCard
      account={{
        id: "acc-credits",
        name: "Credits Account",
        email: "credits@example.com",
        plan_type: "plus",
        auth_mode: "chat_gpt",
        is_active: false,
        created_at: new Date().toISOString(),
        last_used_at: null,
        usage: {
          account_id: "acc-credits",
          plan_type: "plus",
          primary_used_percent: 35,
          primary_window_minutes: 300,
          primary_resets_at: Math.floor(Date.now() / 1000) + 3600,
          secondary_used_percent: null,
          secondary_window_minutes: null,
          secondary_resets_at: null,
          has_credits: true,
          unlimited_credits: false,
          credits_balance: "17.25",
          error: null,
        },
      }}
      onDelete={() => {}}
      onRefresh={async () => {}}
      onRename={async () => {}}
    />,
  );

  expect(screen.getByText("Credits: 17.25")).toBeInTheDocument();
});

it("hides reconnect action for api key accounts", () => {
  render(
    <AccountCard
      account={{
        id: "acc-api",
        name: "API Account",
        email: null,
        plan_type: null,
        auth_mode: "api_key",
        is_active: false,
        created_at: new Date().toISOString(),
        last_used_at: null,
      }}
      onDelete={() => {}}
      onRefresh={async () => {}}
      onReconnect={async () => {}}
      onRename={async () => {}}
    />,
  );

  expect(screen.queryByRole("button", { name: /reconnect/i })).not.toBeInTheDocument();
});
