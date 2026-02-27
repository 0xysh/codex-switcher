import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AddAccountModal, QuickSwitchDialog } from "./components";
import { IconCheck, LiveRegion } from "./components/ui";
import {
  AccountWorkspaceContent,
  AccountWorkspaceControls,
  ActiveWorkspacePanel,
  filterAndSortAccounts,
  InspectorSidebar,
  summarizeAccounts,
  summarizeSafety,
  SwitchSafetyPanel,
  useActivityFeed,
  useProcessMonitor,
  useWorkbenchHotkeys,
  WorkbenchHeader,
} from "./features/workbench";
import { useAccounts } from "./hooks/useAccounts";
import { useTheme } from "./hooks/useTheme";
import { useUiPreferences } from "./hooks/useUiPreferences";
import type { AccountFilter, AccountSort } from "./features/workbench";
import "./App.css";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
  const { processInfo, refreshProcessInfo } = useProcessMonitor();
  const { activity, pushActivity } = useActivityFeed();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = useState(false);
  const [quickSwitchQuery, setQuickSwitchQuery] = useState("");

  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");
  const [accountSort, setAccountSort] = useState<AccountSort>("recent");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useWorkbenchHotkeys({
    isQuickSwitchOpen,
    onOpenQuickSwitch: () => setIsQuickSwitchOpen(true),
    onCloseQuickSwitch: () => setIsQuickSwitchOpen(false),
    searchInputRef,
  });

  const activeAccount = useMemo(() => {
    return accounts.find((account) => account.is_active) || null;
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return filterAndSortAccounts({
      accounts,
      query,
      filter: accountFilter,
      sort: accountSort,
    });
  }, [accountFilter, accountSort, accounts, query]);

  const visibleOtherAccounts = useMemo(() => {
    return filteredAccounts.filter((account) => !account.is_active);
  }, [filteredAccounts]);

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

  const summary = useMemo(() => summarizeAccounts(accounts), [accounts]);

  const handleSwitch = useCallback(
    async (accountId: string) => {
      const latestProcessInfo = await refreshProcessInfo();
      const canSwitch = !latestProcessInfo || latestProcessInfo.can_switch;

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
      } catch (error) {
        console.error("Failed to switch account:", getErrorMessage(error));
        setAnnouncement("Failed to switch account.");
        pushActivity("warning", "Switch attempt failed.");
      } finally {
        setSwitchingId(null);
        void refreshProcessInfo();
      }
    },
    [pushActivity, refreshProcessInfo, switchAccount],
  );

  const handleDelete = useCallback(
    async (accountId: string) => {
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
      } catch (error) {
        console.error("Failed to delete account:", getErrorMessage(error));
        setAnnouncement("Failed to remove account.");
        pushActivity("warning", "Delete action failed.");
      }
    },
    [deleteAccount, deleteConfirmId, pushActivity],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);

    try {
      await refreshUsage();
      setRefreshSuccess(true);
      setAnnouncement("Usage data refreshed.");
      pushActivity("success", "Usage refreshed for all accounts.");

      setTimeout(() => setRefreshSuccess(false), 1800);
    } catch (error) {
      console.error("Failed to refresh usage:", getErrorMessage(error));
      setAnnouncement("Failed to refresh usage.");
      pushActivity("warning", "Usage refresh failed.");
    } finally {
      setIsRefreshing(false);
    }
  }, [pushActivity, refreshUsage]);

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

      <WorkbenchHeader
        query={query}
        isRefreshing={isRefreshing}
        summary={summary}
        searchInputRef={searchInputRef}
        themePreference={themePreference}
        onQueryChange={setQuery}
        onOpenQuickSwitch={() => setIsQuickSwitchOpen(true)}
        onRefreshUsage={() => {
          void handleRefresh();
        }}
        onOpenAddAccount={() => setIsAddModalOpen(true)}
        onThemeChange={setThemePreference}
      />

      <main id="main-content" className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-5">
          <SwitchSafetyPanel processInfo={processInfo} processSummary={processSummary} />

          {activeAccount && <ActiveWorkspacePanel account={activeAccount} summary={summary} />}

          <AccountWorkspaceControls
            accountFilter={accountFilter}
            accountSort={accountSort}
            summary={summary}
            onFilterChange={setAccountFilter}
            onSortChange={setAccountSort}
          />

          <AccountWorkspaceContent
            accounts={accounts}
            filteredAccounts={filteredAccounts}
            visibleOtherAccounts={visibleOtherAccounts}
            activeAccount={activeAccount}
            selectedAccountId={selectedAccountId}
            switchingId={switchingId}
            maskedAccountIdSet={maskedAccountIdSet}
            loading={loading}
            error={error}
            hasRunningProcesses={hasRunningProcesses}
            onOpenAddAccount={() => setIsAddModalOpen(true)}
            onSelectAccount={setSelectedAccountId}
            onSwitch={(accountId) => {
              void handleSwitch(accountId);
            }}
            onDelete={(accountId) => {
              void handleDelete(accountId);
            }}
            onRefreshSingleUsage={refreshSingleUsage}
            onRename={renameAccount}
            onToggleMask={toggleMaskedAccountId}
          />
        </section>

        <InspectorSidebar selectedAccount={selectedAccount} activity={activity} />
      </main>

      {refreshSuccess && (
        <div className="toast-pop fixed bottom-6 right-6 rounded-xl border border-[var(--success-border)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)] shadow-[var(--shadow-soft)]">
          <span className="inline-flex items-center gap-2">
            <IconCheck className="h-4 w-4" />
            Usage refreshed successfully
          </span>
        </div>
      )}

      {deleteConfirmId && (
        <div className="toast-pop fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)] shadow-[var(--shadow-soft)]">
          Press delete again to confirm account removal.
        </div>
      )}

      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingAccountNames={accounts.map((account) => account.name)}
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
