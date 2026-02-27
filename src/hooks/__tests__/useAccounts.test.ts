import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";

import type { AccountInfo } from "../../types";
import { invokeMock } from "../../test/mocks/tauri";
import { useAccounts } from "../useAccounts";

const OAUTH_ACCOUNT: AccountInfo = {
  id: "acc-oauth-1",
  name: "OAuth Account",
  email: "oauth@example.com",
  plan_type: "plus",
  auth_mode: "chat_gpt",
  is_active: true,
  created_at: new Date().toISOString(),
  last_used_at: null,
};

const SECOND_ACCOUNT: AccountInfo = {
  id: "acc-oauth-2",
  name: "Second Account",
  email: "second@example.com",
  plan_type: "plus",
  auth_mode: "chat_gpt",
  is_active: false,
  created_at: new Date().toISOString(),
  last_used_at: null,
};

beforeEach(() => {
  invokeMock.mockReset();
});

it("resolves OAuth completion without waiting for usage refresh", async () => {
  let refreshCallCount = 0;
  let listAccountsCallCount = 0;

  invokeMock.mockImplementation(
    (async (command: string) => {
      switch (command) {
        case "list_accounts":
          listAccountsCallCount += 1;
          if (listAccountsCallCount > 1) {
            return new Promise<never>(() => {});
          }
          return [OAUTH_ACCOUNT];
        case "complete_login":
          return OAUTH_ACCOUNT;
        case "refresh_all_accounts_usage":
          refreshCallCount += 1;
          if (refreshCallCount === 1) {
            return [];
          }
          return new Promise<never>(() => {});
        default:
          return null;
      }
    }) as unknown as Parameters<typeof invokeMock.mockImplementation>[0],
  );

  const { result } = renderHook(() => useAccounts());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  const completionPromise = result.current.completeOAuthLogin().then(() => "resolved" as const);
  const timeoutPromise = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), 800);
  });

  let outcome: "resolved" | "timeout" = "timeout";
  await act(async () => {
    outcome = await Promise.race([completionPromise, timeoutPromise]);
  });

  expect(outcome).toBe("resolved");
  expect(result.current.accounts.some((account) => account.id === OAUTH_ACCOUNT.id)).toBe(true);
  expect(listAccountsCallCount).toBeGreaterThanOrEqual(2);
  expect(refreshCallCount).toBeGreaterThanOrEqual(2);
});

it("reconnects an OAuth account without requiring re-add flow", async () => {
  let refreshCallCount = 0;
  let reconnectCompleted = false;
  const reconnectedAccount: AccountInfo = {
    ...OAUTH_ACCOUNT,
    email: "renewed@example.com",
  };

  invokeMock.mockImplementation(
    (async (command: string, args?: { accountId?: string }) => {
      switch (command) {
        case "list_accounts":
          return reconnectCompleted ? [reconnectedAccount] : [OAUTH_ACCOUNT];
        case "refresh_all_accounts_usage":
          refreshCallCount += 1;
          if (refreshCallCount === 1) {
            return [];
          }
          return new Promise<never>(() => {});
        case "start_reconnect":
          if (args?.accountId !== OAUTH_ACCOUNT.id) {
            throw new Error("unexpected account id");
          }
          return {
            auth_url: "https://auth.openai.com/oauth/authorize?state=reconnect",
            callback_port: 1455,
          };
        case "complete_reconnect":
          reconnectCompleted = true;
          return reconnectedAccount;
        default:
          return null;
      }
    }) as unknown as Parameters<typeof invokeMock.mockImplementation>[0],
  );

  const { result } = renderHook(() => useAccounts());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  const reconnectPromise = result.current.reconnectAccount(OAUTH_ACCOUNT.id).then(() => "resolved" as const);
  const timeoutPromise = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), 800);
  });

  let outcome: "resolved" | "timeout" = "timeout";
  await act(async () => {
    outcome = await Promise.race([reconnectPromise, timeoutPromise]);
  });

  expect(outcome).toBe("resolved");
  expect(invokeMock).toHaveBeenCalledWith("start_reconnect", { accountId: OAUTH_ACCOUNT.id });
  expect(invokeMock).toHaveBeenCalledWith("complete_reconnect");
  expect(result.current.accounts.find((account) => account.id === OAUTH_ACCOUNT.id)?.email).toBe("renewed@example.com");
});

it("reorders accounts and persists the new order", async () => {
  invokeMock.mockImplementation(
    (async (command: string, args?: { accountIds?: string[] }) => {
      switch (command) {
        case "list_accounts":
          return [OAUTH_ACCOUNT, SECOND_ACCOUNT];
        case "refresh_all_accounts_usage":
          return [];
        case "reorder_accounts":
          expect(args?.accountIds).toEqual([SECOND_ACCOUNT.id, OAUTH_ACCOUNT.id]);
          return null;
        default:
          return null;
      }
    }) as unknown as Parameters<typeof invokeMock.mockImplementation>[0],
  );

  const { result } = renderHook(() => useAccounts());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  await act(async () => {
    await result.current.reorderAccounts([SECOND_ACCOUNT.id, OAUTH_ACCOUNT.id]);
  });

  expect(invokeMock).toHaveBeenCalledWith("reorder_accounts", {
    accountIds: [SECOND_ACCOUNT.id, OAUTH_ACCOUNT.id],
  });
  expect(result.current.accounts.map((account) => account.id)).toEqual([
    SECOND_ACCOUNT.id,
    OAUTH_ACCOUNT.id,
  ]);
});
