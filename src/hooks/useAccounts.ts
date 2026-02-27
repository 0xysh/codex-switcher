import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  AccountInfo,
  UsageInfo,
  AccountWithUsage,
  CurrentAuthSummary,
} from "../types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<CurrentAuthSummary | null>(null);

  const mergeAccountSnapshot = useCallback((account: AccountInfo) => {
    setAccounts((prev) => {
      const existing = prev.find((item) => item.id === account.id);
      const mergedActiveAccount: AccountWithUsage = {
        ...account,
        usage: existing?.usage,
        usageLoading: existing?.usageLoading,
      };

      const remainingAccounts = prev
        .filter((item) => item.id !== account.id)
        .map((item) => ({ ...item, is_active: false }));

      return [mergedActiveAccount, ...remainingAccounts];
    });
  }, []);

  const loadAccounts = useCallback(async (preserveUsage = false, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const accountList = await invoke<AccountInfo[]>("list_accounts");
      
      if (preserveUsage) {
        // Preserve existing usage data when just updating account info
        setAccounts((prev) => {
          const usageMap = new Map(prev.map((a) => [a.id, a.usage]));
          return accountList.map((a) => ({
            ...a,
            usage: usageMap.get(a.id),
          }));
        });
      } else {
        setAccounts(accountList.map((a) => ({ ...a })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const refreshUsage = useCallback(async () => {
    try {
      const usageList = await invoke<UsageInfo[]>("refresh_all_accounts_usage");
      setAccounts((prev) =>
        prev.map((account) => {
          const usage = usageList.find((u) => u.account_id === account.id);
          return { ...account, usage, usageLoading: false };
        })
      );
    } catch (err) {
      console.error("Failed to refresh usage:", getErrorMessage(err));
      throw err;
    }
  }, []);

  const refreshSingleUsage = useCallback(async (accountId: string) => {
    try {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, usageLoading: true } : a
        )
      );
      const usage = await invoke<UsageInfo>("get_usage", { accountId });
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, usage, usageLoading: false } : a
        )
      );
    } catch (err) {
      console.error("Failed to refresh single usage:", getErrorMessage(err));
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, usageLoading: false } : a
        )
      );
      throw err;
    }
  }, []);

  const switchAccount = useCallback(
    async (accountId: string) => {
      try {
        await invoke("switch_account", { accountId });
        await loadAccounts(true); // Preserve usage data
      } catch (err) {
        throw err;
      }
    },
    [loadAccounts]
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      try {
        await invoke("delete_account", { accountId });
        await loadAccounts();
      } catch (err) {
        throw err;
      }
    },
    [loadAccounts]
  );

  const renameAccount = useCallback(
    async (accountId: string, newName: string) => {
      try {
        await invoke("rename_account", { accountId, newName });
        await loadAccounts(true); // Preserve usage data
      } catch (err) {
        throw err;
      }
    },
    [loadAccounts]
  );

  const importFromFile = useCallback(
    async (path: string, name: string) => {
      try {
        await invoke<AccountInfo>("add_account_from_file", { path, name });
        await loadAccounts();
        await refreshUsage();
      } catch (err) {
        throw err;
      }
    },
    [loadAccounts, refreshUsage]
  );

  const startOAuthLogin = useCallback(async (accountName: string) => {
    try {
      const info = await invoke<{ auth_url: string; callback_port: number }>(
        "start_login",
        { accountName }
      );
      return info;
    } catch (err) {
      throw err;
    }
  }, []);

  const completeOAuthLogin = useCallback(async () => {
    try {
      const account = await invoke<AccountInfo>("complete_login");
      mergeAccountSnapshot(account);

      void loadAccounts(true, false);

      void refreshUsage().catch((err) => {
        console.error("Failed to refresh usage after OAuth login:", getErrorMessage(err));
      });

      return account;
    } catch (err) {
      throw err;
    }
  }, [loadAccounts, mergeAccountSnapshot, refreshUsage]);

  const cancelOAuthLogin = useCallback(async () => {
    try {
      await invoke("cancel_login");
    } catch (err) {
      console.error("Failed to cancel login:", getErrorMessage(err));
    }
  }, []);

  const reconnectAccount = useCallback(
    async (accountId: string) => {
      const account = accounts.find((item) => item.id === accountId);
      if (!account) {
        throw new Error("Account not found");
      }

      if (account.auth_mode !== "chat_gpt") {
        throw new Error("Reconnect is only available for ChatGPT OAuth accounts");
      }

      try {
        await invoke<{ auth_url: string; callback_port: number }>("start_reconnect", { accountId });
        const refreshedAccount = await invoke<AccountInfo>("complete_reconnect");

        mergeAccountSnapshot(refreshedAccount);

        void loadAccounts(true, false);

        void refreshUsage().catch((err) => {
          console.error("Failed to refresh usage after reconnect:", getErrorMessage(err));
        });

        return refreshedAccount;
      } catch (err) {
        throw err;
      }
    },
    [accounts, loadAccounts, mergeAccountSnapshot, refreshUsage],
  );

  const refreshCurrentSession = useCallback(async () => {
    const summary = await invoke<CurrentAuthSummary>("get_current_auth_summary");
    setCurrentSession(summary);
    return summary;
  }, []);

  const saveCurrentSessionSnapshot = useCallback(async () => {
    const snapshotPath = await invoke<string>("create_auth_snapshot");

    try {
      await refreshCurrentSession();
    } catch (err) {
      console.error("Failed to refresh current session after snapshot:", getErrorMessage(err));
    }

    return snapshotPath;
  }, [refreshCurrentSession]);

  useEffect(() => {
    loadAccounts().then(() => refreshUsage());
    refreshCurrentSession().catch((err) => {
      console.error("Failed to load current session summary:", getErrorMessage(err));
    });
    
    // Auto-refresh usage every 60 seconds (same as official Codex CLI)
    const interval = setInterval(() => {
      refreshUsage().catch(() => {});
    }, 60000);
    
    return () => clearInterval(interval);
  }, [loadAccounts, refreshCurrentSession, refreshUsage]);

  return {
    accounts,
    loading,
    error,
    currentSession,
    snapshotsDirPath: currentSession?.snapshots_dir_path ?? null,
    loadAccounts,
    refreshUsage,
    refreshSingleUsage,
    switchAccount,
    deleteAccount,
    renameAccount,
    importFromFile,
    startOAuthLogin,
    completeOAuthLogin,
    cancelOAuthLogin,
    reconnectAccount,
    refreshCurrentSession,
    saveCurrentSessionSnapshot,
  };
}
