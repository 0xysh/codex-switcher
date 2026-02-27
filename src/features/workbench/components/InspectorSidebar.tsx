import { IconActivity, IconAlertTriangle, IconCheck, IconClock } from "../../../components/ui";
import type { AccountWithUsage } from "../../../types";
import { getRelativeTime } from "../selectors";
import type { ActivityEntry } from "../types";

interface InspectorSidebarProps {
  selectedAccount: AccountWithUsage | null;
  activity: ActivityEntry[];
}

export function InspectorSidebar({ selectedAccount, activity }: InspectorSidebarProps) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <section className="surface-panel p-5">
        <p className="section-title">Inspector</p>
        {selectedAccount ? (
          <div className="mt-3 space-y-3">
            <div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">{selectedAccount.name}</h3>
              <p className="text-sm text-secondary">{selectedAccount.email || "No email available"}</p>
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
                <p className="mono-data mt-1 text-[var(--text-primary)]">{selectedAccount.plan_type || "unknown"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-secondary">
              <p className="mb-1 flex items-center gap-1 text-muted">
                <IconClock className="h-3.5 w-3.5" />
                Last used
              </p>
              <p className="mono-data text-[var(--text-primary)]">
                {selectedAccount.last_used_at ? new Date(selectedAccount.last_used_at).toLocaleString() : "never"}
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
                  {entry.kind === "success" ? "Success" : entry.kind === "warning" ? "Warning" : "Info"}
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
  );
}
