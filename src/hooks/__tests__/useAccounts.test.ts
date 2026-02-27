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
