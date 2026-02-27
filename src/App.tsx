import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import { AccountCard, AddAccountModal, QuickSwitchDialog } from "./components";
import { useAccounts } from "./hooks/useAccounts";
import { useTheme } from "./hooks/useTheme";
import { useUiPreferences } from "./hooks/useUiPreferences";
import {
  Button,
  IconActivity,
  IconAlertTriangle,
  IconArrowRightLeft,
  IconCheck,
  IconClock,
  IconCommand,
  IconFilter,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
  IconUserCircle,
  LiveRegion,
  ThemeToggle,
} from "./components/ui";
import type { AccountWithUsage, CodexProcessInfo } from "./types";
import "./App.css";

type AccountFilter = "all" | "oauth" | "imported" | "attention";
type AccountSort = "recent" | "name" | "usage";

interface ActivityEntry {
  id: number;
  kind: "success" | "warning" | "neutral";
  text: string;
  createdAt: number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getUsageRemaining(account: AccountWithUsage): number | null {
  if (typeof account.usage?.primary_used_percent !== "number") {
    return null;
  }

  return Math.max(0, 100 - account.usage.primary_used_percent);
}

function needsAttention(account: AccountWithUsage): boolean {
  if (account.usage?.error) {
    return true;
  }

  const remaining = getUsageRemaining(account);
  return typeof remaining === "number" && remaining <= 15;
}

function getRelativeTime(timestamp: number): string {
  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);

  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

function summarizeSafety(processInfo: CodexProcessInfo | null) {
  if (!processInfo) {
    return {
      title: "Checking process safety",
      text: "Validating if Codex processes allow account switching.",
      tone: "chip",
    };
  }

  if (processInfo.count > 0) {
    return {
      title: "Switching locked",
      text: `${processInfo.count} Codex process${processInfo.count === 1 ? " is" : "es are"} still running.`,
      tone: "chip chip-warning",
    };
  }

  return {
    title: "Safe to switch",
    text: "No running Codex processes detected.",
    tone: "chip chip-success",
  };
}

function App() {
  const {
    accounts,
    loading,
    error,
    refreshUsage,
    refreshSingleUsage,
    switchAccount,
    deleteAccount,
    renameAccount,
    importFromFile,
    startOAuthLogin,
    completeOAuthLogin,
    cancelOAuthLogin,
  } = useAccounts();

  const { maskedAccountIdSet, toggleMaskedAccountId } = useUiPreferences();
  const { themePreference, setThemePreference } = useTheme();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = useState(false);
  const [quickSwitchQuery, setQuickSwitchQuery] = useState("");

  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [processInfo, setProcessInfo] = useState<CodexProcessInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");
  const [accountSort, setAccountSort] = useState<AccountSort>("recent");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const pushActivity = useCallback((kind: ActivityEntry["kind"], text: string) => {
    setActivity((prev) => {
      const entry: ActivityEntry = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        kind,
        text,
        createdAt: Date.now(),
      };
      return [entry, ...prev].slice(0, 8);
    });
  }, []);

  const checkProcesses = useCallback(async () => {
    try {
      const info = await invoke<CodexProcessInfo>("check_codex_processes");
      setProcessInfo(info);
    } catch (err) {
      console.error("Failed to check processes:", getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void checkProcesses();

    const interval = setInterval(() => {
      void checkProcesses();
    }, 4000);

    return () => clearInterval(interval);
  }, [checkProcesses]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInputLike =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsQuickSwitchOpen(true);
        return;
      }

      if (!isInputLike && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === "Escape" && isQuickSwitchOpen) {
        setIsQuickSwitchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isQuickSwitchOpen]);

  const activeAccount = useMemo(() => {
    return accounts.find((account) => account.is_active) || null;
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const queryFiltered = accounts.filter((account) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        account.name.toLowerCase().includes(normalizedQuery) ||
        (account.email ?? "").toLowerCase().includes(normalizedQuery)
      );
    });

    const statusFiltered = queryFiltered.filter((account) => {
      if (accountFilter === "all") return true;
      if (accountFilter === "oauth") return account.auth_mode === "chat_gpt";
      if (accountFilter === "imported") return account.auth_mode === "api_key";
      return needsAttention(account);
    });

    return [...statusFiltered].sort((left, right) => {
      if (left.is_active && !right.is_active) return -1;
      if (!left.is_active && right.is_active) return 1;

      if (accountSort === "name") {
        return left.name.localeCompare(right.name);
      }

      if (accountSort === "usage") {
        const leftRemaining = getUsageRemaining(left);
        const rightRemaining = getUsageRemaining(right);

        if (leftRemaining === null && rightRemaining === null) return 0;
        if (leftRemaining === null) return 1;
        if (rightRemaining === null) return -1;

        return leftRemaining - rightRemaining;
      }

      const leftLastUsed = left.last_used_at ? new Date(left.last_used_at).getTime() : 0;
      const rightLastUsed = right.last_used_at ? new Date(right.last_used_at).getTime() : 0;
      return rightLastUsed - leftLastUsed;
    });
  }, [accounts, accountFilter, accountSort, query]);

  const visibleOtherAccounts = filteredAccounts.filter((account) => !account.is_active);

  useEffect(() => {
    if (!accounts.length) {
      setSelectedAccountId(null);
      return;
    }

    if (selectedAccountId && accounts.some((account) => account.id === selectedAccountId)) {
      return;
    }

    setSelectedAccountId(activeAccount?.id ?? accounts[0].id);
  }, [accounts, activeAccount, selectedAccountId]);

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) {
      return activeAccount;
    }

    return accounts.find((account) => account.id === selectedAccountId) ?? activeAccount;
  }, [accounts, activeAccount, selectedAccountId]);

  const summary = useMemo(() => {
    const attention = accounts.filter((account) => needsAttention(account)).length;
    const oauth = accounts.filter((account) => account.auth_mode === "chat_gpt").length;
    const imported = accounts.filter((account) => account.auth_mode === "api_key").length;
    return { total: accounts.length, attention, oauth, imported };
  }, [accounts]);

  const handleSwitch = useCallback(
    async (accountId: string) => {
      await checkProcesses();

      const canSwitch = !processInfo || processInfo.can_switch;
      if (!canSwitch) {
        setAnnouncement("Switching blocked until running Codex processes close.");
        pushActivity("warning", "Switch blocked by running Codex process.");
        return;
      }

      try {
        setSwitchingId(accountId);
        await switchAccount(accountId);
        setSelectedAccountId(accountId);
        setAnnouncement("Account switched successfully.");
        pushActivity("success", "Switched active account.");
        setIsQuickSwitchOpen(false);
        setQuickSwitchQuery("");
      } catch (err) {
        console.error("Failed to switch account:", getErrorMessage(err));
        setAnnouncement("Failed to switch account.");
        pushActivity("warning", "Switch attempt failed.");
      } finally {
        setSwitchingId(null);
        void checkProcesses();
      }
    },
    [checkProcesses, processInfo, pushActivity, switchAccount]
  );

  const handleDelete = async (accountId: string) => {
    if (deleteConfirmId !== accountId) {
      setDeleteConfirmId(accountId);
      setAnnouncement("Press delete again to confirm account removal.");
      pushActivity("warning", "Delete confirmation required.");

      setTimeout(() => {
        setDeleteConfirmId((current) => (current === accountId ? null : current));
      }, 3200);
      return;
    }

    try {
      await deleteAccount(accountId);
      setDeleteConfirmId(null);
      setAnnouncement("Account removed.");
      pushActivity("success", "Account removed from switcher.");
    } catch (err) {
      console.error("Failed to delete account:", getErrorMessage(err));
      setAnnouncement("Failed to remove account.");
      pushActivity("warning", "Delete action failed.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);

    try {
      await refreshUsage();
      setRefreshSuccess(true);
      setAnnouncement("Usage data refreshed.");
      pushActivity("success", "Usage refreshed for all accounts.");

      setTimeout(() => setRefreshSuccess(false), 1800);
    } catch (err) {
      console.error("Failed to refresh usage:", getErrorMessage(err));
      setAnnouncement("Failed to refresh usage.");
      pushActivity("warning", "Usage refresh failed.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const processSummary = summarizeSafety(processInfo);
  const hasRunningProcesses = !!processInfo && processInfo.count > 0;

  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-50 rounded bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-white focus:not-sr-only"
      >
        Skip to Main Content
      </a>

      <header className="sticky top-0 z-40 px-4 pb-4 pt-4 sm:px-6">
        <div className="surface-panel mx-auto max-w-7xl px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                <IconSparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Codex Switcher
                </h1>
                <p className="mt-1 text-sm text-secondary">
                  Aurora Signal Workbench for multi-account operations
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 xl:max-w-2xl xl:flex-row xl:items-center xl:justify-end">
              <label
                htmlFor="account-search"
                className="flex h-11 w-full items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 xl:max-w-md"
              >
                <IconSearch className="h-4 w-4 text-muted" />
                <input
                  ref={searchInputRef}
                  id="account-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search account name or email"
                  className="w-full border-0 bg-transparent text-sm text-[var(--text-primary)]"
                />
                <span className="mono-data hidden rounded-md border border-[var(--border-soft)] px-1.5 py-0.5 text-[10px] text-muted md:inline-flex">
                  /
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsQuickSwitchOpen(true);
                  }}
                >
                  <IconCommand className="h-4 w-4" />
                  Quick switch
                </Button>

                <Button
                  variant="secondary"
                  disabled={isRefreshing}
                  onClick={() => {
                    void handleRefresh();
                  }}
                >
                  <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh usage
                </Button>

                <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                  <IconPlus className="h-4 w-4" />
                  Add account
                </Button>

                <ThemeToggle value={themePreference} onChange={setThemePreference} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-5">
          <div className="surface-panel px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-title">Switch Safety</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {processSummary.title}
                </h2>
                <p className="mt-1 text-sm text-secondary">{processSummary.text}</p>
              </div>

              <div className={processSummary.tone}>
                {hasRunningProcesses ? (
                  <IconAlertTriangle className="h-4 w-4" />
                ) : (
                  <IconShieldCheck className="h-4 w-4" />
                )}
                {hasRunningProcesses
                  ? `Blocking PIDs: ${processInfo?.pids.slice(0, 3).join(", ")}${processInfo && processInfo.pids.length > 3 ? "…" : ""}`
                  : "Switching available"}
              </div>
            </div>
          </div>

          {activeAccount && (
            <div className="surface-panel-strong overflow-hidden p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="section-title">Active Workspace</p>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{activeAccount.name}</h2>
                  <p className="text-sm text-secondary">
                    {activeAccount.email || "No email attached"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="chip chip-accent">
                      <IconCheck className="h-3.5 w-3.5" />
                      Active
                    </span>
                    <span className="chip">
                      <IconArrowRightLeft className="h-3.5 w-3.5" />
                      {activeAccount.auth_mode === "api_key" ? "Imported auth" : "OAuth auth"}
                    </span>
                    {needsAttention(activeAccount) && (
                      <span className="chip chip-warning">
                        <IconAlertTriangle className="h-3.5 w-3.5" />
                        Needs attention
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid w-full gap-2 sm:grid-cols-3 md:w-auto md:min-w-[280px]">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted">Accounts</p>
                    <p className="mono-data mt-1 text-lg font-semibold text-[var(--text-primary)]">{summary.total}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted">Attention</p>
                    <p className="mono-data mt-1 text-lg font-semibold text-[var(--text-primary)]">{summary.attention}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted">OAuth / Import</p>
                    <p className="mono-data mt-1 text-lg font-semibold text-[var(--text-primary)]">
                      {summary.oauth} / {summary.imported}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="surface-panel px-4 py-4 sm:px-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="section-title">Account Workspace</h2>

              <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-secondary">
                <IconFilter className="h-3.5 w-3.5" />
                Sort
                <select
                  value={accountSort}
                  onChange={(event) => setAccountSort(event.target.value as AccountSort)}
                  className="cursor-pointer border-0 bg-transparent text-xs text-[var(--text-primary)]"
                >
                  <option value="recent">Recent activity</option>
                  <option value="name">Name</option>
                  <option value="usage">Usage pressure</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All"],
                ["oauth", "OAuth"],
                ["imported", "Imported"],
                ["attention", "Needs attention"],
              ] as const).map(([filter, label]) => {
                const active = accountFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setAccountFilter(filter)}
                    className={`inline-flex h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                      active
                        ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-primary)]"
                        : "border-[var(--border-soft)] bg-[var(--bg-surface)] text-secondary hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && accounts.length === 0 ? (
            <div className="surface-panel p-6">
              <div className="space-y-3">
                <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
                <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
                <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
              </div>
            </div>
          ) : error ? (
            <div className="surface-panel p-6">
              <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                Failed to load accounts: {error}
              </div>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="surface-panel p-8 text-center">
              {accounts.length === 0 ? (
                <>
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                    <IconUserCircle className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">Start with your first account</h3>
                  <p className="mt-2 text-sm text-secondary">
                    Connect a ChatGPT login or import auth.json. Secrets stay in your system keychain.
                  </p>
                  <div className="mt-5">
                    <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                      <IconPlus className="h-4 w-4" />
                      Add account
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">No account matches your filters</h3>
                  <p className="mt-2 text-sm text-secondary">Try changing search, filter, or sorting options.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activeAccount && (
                <AccountCard
                  account={activeAccount}
                  selected={selectedAccountId === activeAccount.id}
                  onSwitch={() => {
                    return;
                  }}
                  onDelete={() => {
                    void handleDelete(activeAccount.id);
                  }}
                  onRefresh={() => refreshSingleUsage(activeAccount.id)}
                  onRename={(newName: string) => renameAccount(activeAccount.id, newName)}
                  onViewDetails={() => setSelectedAccountId(activeAccount.id)}
                  switching={switchingId === activeAccount.id}
                  switchDisabled={hasRunningProcesses}
                  masked={maskedAccountIdSet.has(activeAccount.id)}
                  onToggleMask={() => toggleMaskedAccountId(activeAccount.id)}
                />
              )}

              {visibleOtherAccounts.length > 0 && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {visibleOtherAccounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      selected={selectedAccountId === account.id}
                      onSwitch={() => {
                        void handleSwitch(account.id);
                      }}
                      onDelete={() => {
                        void handleDelete(account.id);
                      }}
                      onRefresh={() => refreshSingleUsage(account.id)}
                      onRename={(newName: string) => renameAccount(account.id, newName)}
                      onViewDetails={() => setSelectedAccountId(account.id)}
                      switching={switchingId === account.id}
                      switchDisabled={hasRunningProcesses}
                      masked={maskedAccountIdSet.has(account.id)}
                      onToggleMask={() => toggleMaskedAccountId(account.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="surface-panel p-5">
            <p className="section-title">Inspector</p>
            {selectedAccount ? (
              <div className="mt-3 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">{selectedAccount.name}</h3>
                  <p className="text-sm text-secondary">
                    {selectedAccount.email || "No email available"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-muted">Auth mode</p>
                    <p className="mono-data mt-1 text-[var(--text-primary)]">
                      {selectedAccount.auth_mode === "api_key" ? "imported" : "oauth"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
                    <p className="text-muted">Plan</p>
                    <p className="mono-data mt-1 text-[var(--text-primary)]">
                      {selectedAccount.plan_type || "unknown"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-secondary">
                  <p className="mb-1 flex items-center gap-1 text-muted">
                    <IconClock className="h-3.5 w-3.5" />
                    Last used
                  </p>
                  <p className="mono-data text-[var(--text-primary)]">
                    {selectedAccount.last_used_at
                      ? new Date(selectedAccount.last_used_at).toLocaleString()
                      : "never"}
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-secondary">
                  <p className="mb-1 flex items-center gap-1 text-muted">
                    <IconActivity className="h-3.5 w-3.5" />
                    Usage status
                  </p>
                  <p className="mono-data text-[var(--text-primary)]">
                    {selectedAccount.usage?.error
                      ? `error: ${selectedAccount.usage.error}`
                      : selectedAccount.usage
                        ? "fresh"
                        : "not yet fetched"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-secondary">Select an account card to inspect details.</p>
            )}
          </section>

          <section className="surface-panel p-5">
            <p className="section-title">Recent Activity</p>
            {activity.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No actions yet in this session.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {activity.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
                  >
                    <p className="mb-1 flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                      {entry.kind === "success" ? (
                        <IconCheck className="h-3.5 w-3.5 text-[var(--success)]" />
                      ) : entry.kind === "warning" ? (
                        <IconAlertTriangle className="h-3.5 w-3.5 text-[var(--warning)]" />
                      ) : (
                        <IconActivity className="h-3.5 w-3.5 text-secondary" />
                      )}
                      {entry.kind === "success"
                        ? "Success"
                        : entry.kind === "warning"
                          ? "Warning"
                          : "Info"}
                    </p>
                    <p className="text-secondary">{entry.text}</p>
                    <p className="mt-1 text-muted">{getRelativeTime(entry.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface-panel p-5">
            <p className="section-title">Shortcuts</p>
            <div className="mt-3 space-y-2 text-xs text-secondary">
              <p className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
                <span>Quick switch</span>
                <span className="mono-data">Ctrl/Cmd + K</span>
              </p>
              <p className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
                <span>Search accounts</span>
                <span className="mono-data">/</span>
              </p>
              <p className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
                <span>Close panel</span>
                <span className="mono-data">Esc</span>
              </p>
            </div>
          </section>
        </aside>
      </main>

      {refreshSuccess && (
        <div className="fixed bottom-6 right-6 rounded-xl border border-[var(--success-border)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)] shadow-[var(--shadow-soft)]">
          <span className="inline-flex items-center gap-2">
            <IconCheck className="h-4 w-4" />
            Usage refreshed successfully
          </span>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)] shadow-[var(--shadow-soft)]">
          Press delete again to confirm account removal.
        </div>
      )}

      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onImportFile={importFromFile}
        onStartOAuth={startOAuthLogin}
        onCompleteOAuth={completeOAuthLogin}
        onCancelOAuth={cancelOAuthLogin}
      />

      <QuickSwitchDialog
        isOpen={isQuickSwitchOpen}
        query={quickSwitchQuery}
        switchingId={switchingId}
        accounts={accounts}
        onClose={() => setIsQuickSwitchOpen(false)}
        onQueryChange={setQuickSwitchQuery}
        onSwitch={handleSwitch}
      />

      <LiveRegion label="Global Announcements" message={announcement} />
    </div>
  );
}

export default App;
