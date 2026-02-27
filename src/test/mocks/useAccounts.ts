import { vi } from "vitest";

import type { AccountInfo, AccountWithUsage, OAuthLoginInfo } from "../../types";

type UseAccountsState = {
  accounts: AccountWithUsage[];
  loading: boolean;
  error: string | null;
  loadAccounts: (preserveUsage?: boolean) => Promise<void>;
  refreshUsage: () => Promise<void>;
  refreshSingleUsage: (accountId: string) => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  renameAccount: (accountId: string, newName: string) => Promise<void>;
  importFromFile: (path: string, name: string) => Promise<void>;
  startOAuthLogin: (accountName: string) => Promise<OAuthLoginInfo>;
  completeOAuthLogin: () => Promise<AccountInfo>;
  cancelOAuthLogin: () => Promise<void>;
};

const asyncNoop = async () => undefined;

export function createUseAccountsMock(
  overrides: Partial<UseAccountsState> = {}
): UseAccountsState {
  return {
    accounts: [],
    loading: false,
    error: null,
    loadAccounts: vi.fn(async (_preserveUsage?: boolean) => {
      return;
    }),
    refreshUsage: vi.fn(asyncNoop),
    refreshSingleUsage: vi.fn(async (_accountId: string) => {
      return;
    }),
    switchAccount: vi.fn(async (_accountId: string) => {
      return;
    }),
    deleteAccount: vi.fn(async (_accountId: string) => {
      return;
    }),
    renameAccount: vi.fn(async (_accountId: string, _newName: string) => {
      return;
    }),
    importFromFile: vi.fn(async (_path: string, _name: string) => {
      return;
    }),
    startOAuthLogin: vi.fn(async (_accountName: string): Promise<OAuthLoginInfo> => ({
      auth_url: "https://example.com",
      callback_port: 0,
    })),
    completeOAuthLogin: vi.fn(async (): Promise<AccountInfo> => ({
      id: "mock",
      name: "Mock",
      email: null,
      plan_type: null,
      auth_mode: "chat_gpt",
      is_active: false,
      created_at: new Date().toISOString(),
      last_used_at: null,
    })),
    cancelOAuthLogin: vi.fn(asyncNoop),
    ...overrides,
  };
}
