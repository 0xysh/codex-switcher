import { AccountCard } from "../../../components";
import { Button, IconPlus, IconUserCircle } from "../../../components/ui";
import type { AccountWithUsage } from "../../../types";

interface AccountWorkspaceContentProps {
  accounts: AccountWithUsage[];
  loading: boolean;
  error: string | null;
  onOpenAddAccount: () => void;
  onDelete: (accountId: string) => void;
  onRefreshSingleUsage: (accountId: string) => Promise<void>;
  onReconnectAccount: (accountId: string) => Promise<void>;
  onRename: (accountId: string, newName: string) => Promise<void>;
}

export function AccountWorkspaceContent({
  accounts,
  loading,
  error,
  onOpenAddAccount,
  onDelete,
  onRefreshSingleUsage,
  onReconnectAccount,
  onRename,
}: AccountWorkspaceContentProps) {
  if (loading && accounts.length === 0) {
    return (
      <div className="surface-panel reveal-rise p-6">
        <p className="section-title">Accounts Workspace</p>
        <div className="mt-4 space-y-3">
          <div className="h-14 animate-pulse rounded-2xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
          <div className="h-14 animate-pulse rounded-2xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
          <div className="h-14 animate-pulse rounded-2xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-panel reveal-rise p-6">
        <p className="section-title">Accounts Workspace</p>
        <div className="mt-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          Failed to load accounts: {error}
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="surface-panel reveal-rise p-8 text-center">
        <p className="section-title">Accounts Workspace</p>
        <div className="mx-auto mt-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-primary)] shadow-[var(--shadow-soft)]">
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
    <section className="reveal-rise space-y-3" aria-label="Accounts Workspace">
      <div className="surface-panel rounded-2xl border-[var(--border-soft)] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-title">Accounts Workspace</p>
            <p className="mt-1 text-sm text-secondary text-pretty">
              Review account health, usage windows, and reconnection needs in one scan.
            </p>
          </div>
          <span className="chip chip-accent mono-data text-[11px]">
            {accounts.length} {accounts.length === 1 ? "ACCOUNT" : "ACCOUNTS"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onDelete={() => onDelete(account.id)}
            onRefresh={() => onRefreshSingleUsage(account.id)}
            onReconnect={() => onReconnectAccount(account.id)}
            onRename={(newName: string) => onRename(account.id, newName)}
          />
        ))}
      </div>
    </section>
  );
}
