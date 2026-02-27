import { useMemo, useState } from "react";

import { Button, IconKey, IconPlus, IconRefresh } from "../../../components/ui";
import type { CurrentAuthSummary } from "../../../types";

interface CurrentCodexSessionCardProps {
  summary: CurrentAuthSummary | null;
  onRefresh: () => Promise<unknown>;
  onSaveSnapshot: () => Promise<string>;
  onImportSnapshot: () => void;
}

const STATUS_LABELS: Record<CurrentAuthSummary["status"], string> = {
  ready: "Ready",
  missing: "Missing",
  invalid: "Invalid",
  error: "Error",
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleString();
}

export function CurrentCodexSessionCard({
  summary,
  onRefresh,
  onSaveSnapshot,
  onImportSnapshot,
}: CurrentCodexSessionCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const status = summary?.status ?? "missing";
  const statusLabel = summary ? STATUS_LABELS[summary.status] : "Checking";

  const modeLabel = useMemo(() => {
    if (!summary?.auth_mode) {
      return "Unknown";
    }

    return summary.auth_mode === "chat_gpt" ? "ChatGPT OAuth" : "API Key";
  }, [summary]);

  const statusToneClass =
    status === "ready"
      ? "chip chip-success"
      : status === "missing" || status === "invalid"
        ? "chip chip-warning"
        : "chip";

  return (
    <section className="surface-panel p-5" aria-label="Current Codex Session">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-title">Current Codex Session</p>
          <p className="mt-2 text-sm text-secondary">
            Refresh the current CLI auth file, save a snapshot, or import a snapshot account.
          </p>
        </div>
        <span className={statusToneClass}>Status: {statusLabel}</span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-secondary sm:grid-cols-2">
        <div>
          <dt className="text-muted">Mode</dt>
          <dd className="text-[var(--text-primary)]">{modeLabel}</dd>
        </div>
        <div>
          <dt className="text-muted">Email</dt>
          <dd className="text-[var(--text-primary)]">{summary?.email ?? "Not available"}</dd>
        </div>
        <div>
          <dt className="text-muted">Plan</dt>
          <dd className="text-[var(--text-primary)]">{summary?.plan_type ?? "Not available"}</dd>
        </div>
        <div>
          <dt className="text-muted">Last Modified</dt>
          <dd className="text-[var(--text-primary)]">{formatTimestamp(summary?.last_modified_at ?? null)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Source File</dt>
          <dd className="mono-data mt-1 text-xs text-[var(--text-primary)]">
            {summary?.auth_file_path ?? "~/.codex/auth.json"}
          </dd>
        </div>
      </dl>

      {summary?.message && <p className="mt-3 text-sm text-secondary">{summary.message}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="min-h-11"
          disabled={isRefreshing}
          onClick={() => {
            setIsRefreshing(true);
            onRefresh()
              .then(() => setFeedback("Session metadata refreshed."))
              .catch(() => setFeedback("Failed to refresh session metadata."))
              .finally(() => setIsRefreshing(false));
          }}
        >
          <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh session
        </Button>

        <Button
          variant="secondary"
          className="min-h-11"
          disabled={isSavingSnapshot}
          onClick={() => {
            setIsSavingSnapshot(true);
            onSaveSnapshot()
              .then(() => setFeedback("Snapshot saved."))
              .catch(() => setFeedback("Failed to save snapshot."))
              .finally(() => setIsSavingSnapshot(false));
          }}
        >
          <IconKey className="h-4 w-4" />
          Save snapshot
        </Button>

        <Button variant="primary" className="min-h-11" onClick={onImportSnapshot}>
          <IconPlus className="h-4 w-4" />
          Import snapshot
        </Button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {feedback}
      </p>
    </section>
  );
}
