import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { openUrlMock } from "../../test/mocks/tauri";
import { AddAccountModal } from "../AddAccountModal";

it("has accessible close button and labeled account name input", () => {
  render(
    <AddAccountModal
      isOpen
      onClose={vi.fn()}
      onImportFile={vi.fn(async () => {})}
      onStartOAuth={vi.fn(async () => ({ auth_url: "https://auth.openai.com/oauth/authorize?state=test" }))}
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
      onStartOAuth={vi.fn(async () => ({ auth_url: "https://auth.openai.com/oauth/authorize?state=test" }))}
      onCompleteOAuth={vi.fn(() => new Promise<unknown>(() => {}))}
      onCancelOAuth={onCancelOAuth}
    />
  );

  await user.type(screen.getByLabelText(/account name/i), "Work Account");
  await user.click(screen.getByRole("button", { name: /login with chatgpt/i }));

  expect(
    await screen.findByText(/waiting for browser login…/i)
  ).toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: /import auth\.json/i }));

  expect(onCancelOAuth).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/waiting for browser login…/i)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import account/i })).toBeEnabled();
});

it("continues oauth completion when browser opener stays pending", async () => {
  openUrlMock.mockImplementationOnce(() => new Promise<undefined>(() => {}));

  const onClose = vi.fn();
  const onCompleteOAuth = vi.fn(async () => ({}));

  const user = userEvent.setup();
  render(
    <AddAccountModal
      isOpen
      onClose={onClose}
      onImportFile={vi.fn(async () => {})}
      onStartOAuth={vi.fn(async () => ({ auth_url: "https://auth.openai.com/oauth/authorize?state=test" }))}
      onCompleteOAuth={onCompleteOAuth}
      onCancelOAuth={vi.fn(async () => {})}
    />,
  );

  await user.type(screen.getByLabelText(/account name/i), "Work Account");
  await user.click(screen.getByRole("button", { name: /login with chatgpt/i }));

  await waitFor(() => expect(onCompleteOAuth).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it("ignores duplicate oauth starts while a login attempt is already in flight", async () => {
  const onStartOAuth = vi.fn(() => new Promise<{ auth_url: string }>(() => {}));

  const user = userEvent.setup();
  render(
    <AddAccountModal
      isOpen
      onClose={vi.fn()}
      onImportFile={vi.fn(async () => {})}
      onStartOAuth={onStartOAuth}
      onCompleteOAuth={vi.fn(async () => ({}))}
      onCancelOAuth={vi.fn(async () => {})}
    />,
  );

  await user.type(screen.getByLabelText(/account name/i), "Work Account");
  const loginButton = screen.getByRole("button", { name: /login with chatgpt/i });

  await user.click(loginButton);
  await user.click(loginButton);

  expect(onStartOAuth).toHaveBeenCalledTimes(1);
});

it("rejects untrusted oauth URLs before browser launch", async () => {
  const onCompleteOAuth = vi.fn(async () => ({}));

  const user = userEvent.setup();
  render(
    <AddAccountModal
      isOpen
      onClose={vi.fn()}
      onImportFile={vi.fn(async () => {})}
      onStartOAuth={vi.fn(async () => ({ auth_url: "https://example.com/oauth/authorize" }))}
      onCompleteOAuth={onCompleteOAuth}
      onCancelOAuth={vi.fn(async () => {})}
    />,
  );

  await user.type(screen.getByLabelText(/account name/i), "Work Account");
  await user.click(screen.getByRole("button", { name: /login with chatgpt/i }));

  expect(onCompleteOAuth).not.toHaveBeenCalled();
  expect(await screen.findByText(/invalid oauth url from backend/i)).toBeInTheDocument();
});
