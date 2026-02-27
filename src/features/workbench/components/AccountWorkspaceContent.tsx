import { AccountCard } from "../../../components";
import { Button, IconPlus, IconUserCircle } from "../../../components/ui";
import type { AccountWithUsage } from "../../../types";

interface AccountWorkspaceContentProps {
  accounts: AccountWithUsage[];
  loading: boolean;
  error: string | null;
  maskedAccountIdSet: Set<string>;
  onOpenAddAccount: () => void;
  onDelete: (accountId: string) => void;
  onRefreshSingleUsage: (accountId: string) => Promise<void>;
  onRename: (accountId: string, newName: string) => Promise<void>;
  onToggleMask: (accountId: string) => void;
}

export function AccountWorkspaceContent({
  accounts,
  loading,
  error,
  maskedAccountIdSet,
  onOpenAddAccount,
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

  if (accounts.length === 0) {
    return (
      <div className="surface-panel p-8 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
          <IconUserCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">Start with your first account</h3>
        <p className="mt-2 text-sm text-secondary">Connect a ChatGPT login or import an existing auth.json file.</p>
        <div className="mt-5">
          <Button variant="primary" onClick={onOpenAddAccount}>
            <IconPlus className="h-4 w-4" />
            Add account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          onDelete={() => onDelete(account.id)}
          onRefresh={() => onRefreshSingleUsage(account.id)}
          onRename={(newName: string) => onRename(account.id, newName)}
          masked={maskedAccountIdSet.has(account.id)}
          onToggleMask={() => onToggleMask(account.id)}
        />
      ))}
    </div>
  );
}
