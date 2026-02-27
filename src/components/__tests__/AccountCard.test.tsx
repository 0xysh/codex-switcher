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
        onRename={async () => {}}
        onToggleMask={() => {}}
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
        onRename={async () => {}}
        onToggleMask={() => {}}
      />
    </div>
  );

  const cards = screen.getAllByRole("article");
  expect(cards).toHaveLength(2);

  cards.forEach((card) => {
    expect(within(card).getByRole("button", { name: /rename account/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /refresh usage/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /remove account/i })).toBeInTheDocument();
    expect(within(card).queryByText(/switch now/i)).not.toBeInTheDocument();
    expect(within(card).queryByText(/active now/i)).not.toBeInTheDocument();
  });
});
