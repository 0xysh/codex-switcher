import { useCallback, useMemo, useState } from "react";

import { AddAccountModal, ThemePaletteModal } from "./components";
import { IconCheck, LiveRegion } from "./components/ui";
import {
  AccountWorkspaceContent,
  CurrentCodexSessionCard,
  RecentActivityPanel,
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

function getParentDirectory(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  const match = path.match(/^(.*)[/\\][^/\\]+$/);
  if (!match || match.length < 2) {
    return null;
  }

  return match[1] || null;
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
    reconnectAccount,
    saveCurrentSessionSnapshot,
    deleteAccount,
    renameAccount,
    reorderAccounts,
    importFromFile,
    startOAuthLogin,
    completeOAuthLogin,
    cancelOAuthLogin,
  } = useAccounts();

  const { themePreference, setThemePreference } = useTheme();
  const { cardDensityMode, setCardDensityMode, isWorkbenchHeaderCollapsed, setWorkbenchHeaderCollapsed, isCurrentSessionCollapsed, setCurrentSessionCollapsed } = useUiPreferences();
  const { processInfo } = useProcessMonitor();
  const { activity, pushActivity } = useActivityFeed();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isThemePaletteModalOpen, setIsThemePaletteModalOpen] = useState(false);
  const [filePickerDefaultPath, setFilePickerDefaultPath] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const authDirectoryPath = useMemo(
    () => getParentDirectory(currentSession?.auth_file_path),
    [currentSession?.auth_file_path],
  );

  const snapshotDirectoryPath = useMemo(
    () => currentSession?.snapshots_dir_path ?? snapshotsDirPath,
    [currentSession?.snapshots_dir_path, snapshotsDirPath],
  );

  const closeAddAccountModal = useCallback(() => {
    setIsAddModalOpen(false);
    setFilePickerDefaultPath(null);
  }, []);

  const openAddAccountModal = useCallback((preferredPath?: string | null) => {
    setFilePickerDefaultPath(preferredPath ?? authDirectoryPath ?? snapshotDirectoryPath ?? null);
    setIsAddModalOpen(true);
  }, [authDirectoryPath, snapshotDirectoryPath]);

  const openImportSnapshotModal = useCallback(async () => {
    let refreshedSession = currentSession;

    try {
      refreshedSession = await refreshCurrentSession();
    } catch (error) {
      console.error("Failed to refresh current session before import:", getErrorMessage(error));
    }

    const refreshedAuthDir = getParentDirectory(refreshedSession?.auth_file_path);
    openAddAccountModal(
      refreshedSession?.snapshots_dir_path ?? snapshotDirectoryPath ?? refreshedAuthDir ?? authDirectoryPath ?? null,
    );
  }, [authDirectoryPath, currentSession, openAddAccountModal, refreshCurrentSession, snapshotDirectoryPath]);

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

  const handleReconnect = useCallback(
    async (accountId: string) => {
      const account = accounts.find((item) => item.id === accountId);

      try {
        await reconnectAccount(accountId);
        setAnnouncement("Account reconnected.");
        pushActivity(
          "success",
          account ? `Reconnected ${account.name} and refreshed credentials.` : "Account reconnected and refreshed.",
        );
      } catch (error) {
        console.error("Failed to reconnect account:", getErrorMessage(error));
        setAnnouncement("Failed to reconnect account.");
        pushActivity(
          "warning",
          account ? `Reconnect failed for ${account.name}.` : "Reconnect action failed.",
        );
        throw error;
      }
    },
    [accounts, pushActivity, reconnectAccount],
  );

  const handleReorderAccounts = useCallback(
    async (accountIds: string[]) => {
      try {
        await reorderAccounts(accountIds);
        setAnnouncement("Account order updated.");
        pushActivity("neutral", "Account order updated.");
      } catch (error) {
        console.error("Failed to reorder accounts:", getErrorMessage(error));
        setAnnouncement("Failed to reorder accounts.");
        pushActivity("warning", "Account reorder failed.");
        throw error;
      }
    },
    [pushActivity, reorderAccounts],
  );

  const toggleCardDensityMode = useCallback(() => {
    const nextMode = cardDensityMode === "full" ? "compact" : "full";
    setCardDensityMode(nextMode);

    const message = nextMode === "compact"
      ? "Compact account card view enabled."
      : "Full account card view enabled.";

    setAnnouncement(message);
    pushActivity("neutral", message);
  }, [cardDensityMode, pushActivity, setCardDensityMode]);

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
        processInfo={processInfo}
        cardDensityMode={cardDensityMode}
        themePreference={themePreference}
        isCollapsed={isWorkbenchHeaderCollapsed}
        onRefreshUsage={() => void handleRefresh()}
        onOpenAddAccount={openAddAccountModal}
        onOpenThemePalette={() => setIsThemePaletteModalOpen(true)}
        onToggleCollapsed={() => setWorkbenchHeaderCollapsed(!isWorkbenchHeaderCollapsed)}
        onToggleCardDensityMode={toggleCardDensityMode}
        onThemeChange={setThemePreference}
      />

      <main id="main-content" className="mx-auto max-w-[90rem] px-4 pb-12 sm:px-6">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="reveal-rise stagger-1 space-y-5">
            <AccountWorkspaceContent
              accounts={accounts}
              loading={loading}
              error={error}
              cardDensityMode={cardDensityMode}
              onOpenAddAccount={openAddAccountModal}
              onDelete={(accountId) => {
                void handleDelete(accountId);
              }}
              onRefreshSingleUsage={refreshSingleUsage}
              onReconnectAccount={handleReconnect}
              onRename={renameAccount}
              onReorderAccounts={handleReorderAccounts}
            />

            <CurrentCodexSessionCard
              summary={currentSession}
              isCollapsed={isCurrentSessionCollapsed}
              onRefresh={refreshCurrentSession}
              onSaveSnapshot={handleSaveSnapshot}
              onImportSnapshot={() => void openImportSnapshotModal()}
              onToggleCollapsed={() => setCurrentSessionCollapsed(!isCurrentSessionCollapsed)}
            />
          </section>

          <div className="reveal-rise stagger-2 2xl:sticky 2xl:top-5 2xl:self-start">
            <RecentActivityPanel activity={activity} />
          </div>
        </div>
      </main>

      {refreshSuccess && (
        <div className="toast-pop fixed bottom-6 right-6 z-40 rounded-2xl border border-[var(--success-border)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)] shadow-[var(--shadow-raised)] backdrop-blur">
          <span className="inline-flex items-center gap-2">
            <IconCheck className="h-4 w-4" />
            Usage refreshed successfully
          </span>
        </div>
      )}

      {deleteConfirmId && (
        <div className="toast-pop fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)] shadow-[var(--shadow-raised)] backdrop-blur">
          Press delete again to confirm account removal.
        </div>
      )}

      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={closeAddAccountModal}
        snapshotsDirPath={filePickerDefaultPath}
        existingAccountNames={accounts.map((account) => account.name)}
        onImportFile={importFromFile}
        onStartOAuth={startOAuthLogin}
        onCompleteOAuth={completeOAuthLogin}
        onCancelOAuth={cancelOAuthLogin}
      />

      <ThemePaletteModal
        isOpen={isThemePaletteModalOpen}
        onClose={() => setIsThemePaletteModalOpen(false)}
      />

      <LiveRegion label="Global Announcements" message={announcement} />
    </div>
  );
}

export default App;
