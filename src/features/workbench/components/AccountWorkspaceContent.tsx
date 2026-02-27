import { AccountCard } from "../../../components";
import { Button, IconPlus, IconUserCircle } from "../../../components/ui";
import type { AccountWithUsage } from "../../../types";

interface AccountWorkspaceContentProps {
  accounts: AccountWithUsage[];
  filteredAccounts: AccountWithUsage[];
  visibleOtherAccounts: AccountWithUsage[];
  activeAccount: AccountWithUsage | null;
  selectedAccountId: string | null;
  switchingId: string | null;
  maskedAccountIdSet: Set<string>;
  loading: boolean;
  error: string | null;
  hasRunningProcesses: boolean;
  onOpenAddAccount: () => void;
  onSelectAccount: (accountId: string) => void;
  onSwitch: (accountId: string) => void;
  onDelete: (accountId: string) => void;
  onRefreshSingleUsage: (accountId: string) => Promise<void>;
  onRename: (accountId: string, newName: string) => Promise<void>;
  onToggleMask: (accountId: string) => void;
}

export function AccountWorkspaceContent({
  accounts,
  filteredAccounts,
  visibleOtherAccounts,
  activeAccount,
  selectedAccountId,
  switchingId,
  maskedAccountIdSet,
  loading,
  error,
  hasRunningProcesses,
  onOpenAddAccount,
  onSelectAccount,
  onSwitch,
  onDelete,
  onRefreshSingleUsage,
  onRename,
  onToggleMask,
}: AccountWorkspaceContentProps) {
  if (loading && accounts.length === 0) {
    return (
      <div className="surface-panel p-6">
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
          <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
          <div className="h-12 animate-pulse rounded-xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-panel p-6">
        <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          Failed to load accounts: {error}
        </div>
      </div>
    );
  }

  if (filteredAccounts.length === 0) {
    return (
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
              <Button variant="primary" onClick={onOpenAddAccount}>
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
    );
  }

  return (
    <div className="space-y-4">
      {activeAccount && (
        <AccountCard
          account={activeAccount}
          selected={selectedAccountId === activeAccount.id}
          onSwitch={() => {
            return;
          }}
          onDelete={() => {
            onDelete(activeAccount.id);
          }}
          onRefresh={() => onRefreshSingleUsage(activeAccount.id)}
          onRename={(newName: string) => onRename(activeAccount.id, newName)}
          onViewDetails={() => onSelectAccount(activeAccount.id)}
          switching={switchingId === activeAccount.id}
          switchDisabled={hasRunningProcesses}
          masked={maskedAccountIdSet.has(activeAccount.id)}
          onToggleMask={() => onToggleMask(activeAccount.id)}
        />
      )}

      {visibleOtherAccounts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibleOtherAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              selected={selectedAccountId === account.id}
              onSwitch={() => onSwitch(account.id)}
              onDelete={() => onDelete(account.id)}
              onRefresh={() => onRefreshSingleUsage(account.id)}
              onRename={(newName: string) => onRename(account.id, newName)}
              onViewDetails={() => onSelectAccount(account.id)}
              switching={switchingId === account.id}
              switchDisabled={hasRunningProcesses}
              masked={maskedAccountIdSet.has(account.id)}
              onToggleMask={() => onToggleMask(account.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
