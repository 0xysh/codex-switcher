import { useCallback, useMemo, useState } from "react";

import { AddAccountModal } from "./components";
import { IconCheck, LiveRegion } from "./components/ui";
import {
  AccountWorkspaceContent,
  CurrentCodexSessionCard,
  InspectorSidebar,
  summarizeAccounts,
  useActivityFeed,
  useProcessMonitor,
  WorkbenchHeader,
} from "./features/workbench";
import { useAccounts } from "./hooks/useAccounts";
import { useTheme } from "./hooks/useTheme";
import { useUiPreferences } from "./hooks/useUiPreferences";
import "./App.css";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function App() {
  const {
    accounts,
    loading,
    error,
    currentSession,
    snapshotsDirPath,
    refreshUsage,
    refreshCurrentSession,
    refreshSingleUsage,
    saveCurrentSessionSnapshot,
    deleteAccount,
    renameAccount,
    importFromFile,
    startOAuthLogin,
    completeOAuthLogin,
    cancelOAuthLogin,
  } = useAccounts();

  const { maskedAccountIdSet, toggleMaskedAccountId } = useUiPreferences();
  const { themePreference, setThemePreference } = useTheme();
  const { processInfo } = useProcessMonitor();
  const { activity, pushActivity } = useActivityFeed();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const closeAddAccountModal = useCallback(() => setIsAddModalOpen(false), []);
  const openAddAccountModal = useCallback(() => setIsAddModalOpen(true), []);

  const summary = useMemo(() => summarizeAccounts(accounts), [accounts]);

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

  const handleSaveSnapshot = useCallback(async () => {
    try {
      const snapshotPath = await saveCurrentSessionSnapshot();
      setAnnouncement("Snapshot saved.");
      pushActivity("success", `Session snapshot saved at ${snapshotPath}.`);
      return snapshotPath;
    } catch (error) {
      console.error("Failed to save session snapshot:", getErrorMessage(error));
      setAnnouncement("Failed to save snapshot.");
      pushActivity("warning", "Session snapshot save failed.");
      throw error;
    }
  }, [pushActivity, saveCurrentSessionSnapshot]);

  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-50 rounded bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-white focus:not-sr-only"
      >
        Skip to Main Content
      </a>

      <WorkbenchHeader
        isRefreshing={isRefreshing}
        summary={summary}
        themePreference={themePreference}
        onRefreshUsage={() => {
          void handleRefresh();
        }}
        onOpenAddAccount={openAddAccountModal}
        onThemeChange={setThemePreference}
      />

      <main id="main-content" className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-5">
          <CurrentCodexSessionCard
            summary={currentSession}
            onRefresh={refreshCurrentSession}
            onSaveSnapshot={handleSaveSnapshot}
            onImportSnapshot={openAddAccountModal}
          />

          <AccountWorkspaceContent
            accounts={accounts}
            maskedAccountIdSet={maskedAccountIdSet}
            loading={loading}
            error={error}
            onOpenAddAccount={openAddAccountModal}
            onDelete={(accountId) => {
              void handleDelete(accountId);
            }}
            onRefreshSingleUsage={refreshSingleUsage}
            onRename={renameAccount}
            onToggleMask={toggleMaskedAccountId}
          />
        </section>

        <InspectorSidebar processInfo={processInfo} activity={activity} />
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
        onClose={closeAddAccountModal}
        snapshotsDirPath={snapshotsDirPath}
        existingAccountNames={accounts.map((account) => account.name)}
        onImportFile={importFromFile}
        onStartOAuth={startOAuthLogin}
        onCompleteOAuth={completeOAuthLogin}
        onCancelOAuth={cancelOAuthLogin}
      />

      <LiveRegion label="Global Announcements" message={announcement} />
    </div>
  );
}

export default App;
