import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { AddAccountModal } from "../AddAccountModal";

it("has accessible close button and labeled account name input", () => {
  render(
    <AddAccountModal
      isOpen
      onClose={vi.fn()}
      onImportFile={vi.fn(async () => {})}
      onStartOAuth={vi.fn(async () => ({ auth_url: "https://example.com" }))}
      onCompleteOAuth={vi.fn(async () => ({}))}
      onCancelOAuth={vi.fn(async () => {})}
    />
  );

  expect(
    screen.getByRole("button", { name: /close add account modal/i })
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/account name/i)).toHaveAttribute(
    "name",
    "accountName"
  );
});

it("does not stay stuck in oauth pending state after cancellation", async () => {
  const onCancelOAuth = vi.fn(async () => {});

  const user = userEvent.setup();
  render(
    <AddAccountModal
      isOpen
      onClose={vi.fn()}
      onImportFile={vi.fn(async () => {})}
      onStartOAuth={vi.fn(async () => ({ auth_url: "https://example.com" }))}
      onCompleteOAuth={vi.fn(() => new Promise<unknown>(() => {}))}
      onCancelOAuth={onCancelOAuth}
    />
  );

  await user.type(screen.getByLabelText(/account name/i), "Work Account");
  await user.click(screen.getByRole("button", { name: /login with chatgpt/i }));

  expect(
    await screen.findByText(/waiting for browser login…/i)
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^import file$/i }));

  expect(onCancelOAuth).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/waiting for browser login…/i)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^import$/i })).toBeEnabled();
});
