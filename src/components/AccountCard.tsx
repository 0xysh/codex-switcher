import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import type { AccountWithUsage } from "../types";
import { UsageBar } from "./UsageBar";
import {
  Button,
  IconActivity,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconEye,
  IconEyeOff,
  IconButton,
  IconKey,
  IconRefresh,
  IconShieldCheck,
  IconTrash,
} from "./ui";

interface AccountCardProps {
  account: AccountWithUsage;
  onDelete: () => void;
  onRefresh: () => Promise<void>;
  onRename: (newName: string) => Promise<void>;
  masked?: boolean;
  onToggleMask?: () => void;
}

function formatLastRefresh(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 10) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

function BlurredText({ children, blur }: { children: ReactNode; blur: boolean }) {
  return (
    <span
      className={`select-none transition-[filter] duration-200 ${blur ? "blur-sm" : ""}`}
      style={blur ? { userSelect: "none" } : undefined}
    >
      {children}
    </span>
  );
}

function getUsageStatus(account: AccountWithUsage) {
  if (account.usage?.error) {
    return {
      label: "Needs attention",
      className: "chip chip-danger",
      icon: IconAlertTriangle,
    };
  }

  if (typeof account.usage?.primary_used_percent === "number" && account.usage.primary_used_percent >= 80) {
    return {
      label: "Near limit",
      className: "chip chip-warning",
      icon: IconAlertTriangle,
    };
  }

  return {
    label: "Healthy",
    className: "chip chip-success",
    icon: IconShieldCheck,
  };
}

export function AccountCard({
  account,
  onDelete,
  onRefresh,
  onRename,
  masked = false,
  onToggleMask,
}: AccountCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(
    account.usage && !account.usage.error ? new Date() : null
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(account.name);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditName(account.name);
  }, [account.name]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const commitRename = async () => {
    const trimmed = editName.trim();

    if (!trimmed || trimmed === account.name || isRenaming) {
      setEditName(account.name);
      setIsEditing(false);
      return;
    }

    try {
      setIsRenaming(true);
      await onRename(trimmed);
    } catch {
      setEditName(account.name);
    } finally {
      setIsRenaming(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      void commitRename();
    }

    if (event.key === "Escape") {
      setEditName(account.name);
      setIsEditing(false);
    }
  };

  const planDisplay = account.plan_type
    ? account.plan_type.charAt(0).toUpperCase() + account.plan_type.slice(1)
    : account.auth_mode === "api_key" ? "API Key" : "Unknown";

  const authModeDisplay = account.auth_mode === "api_key" ? "Imported" : "OAuth";
  const usageStatus = getUsageStatus(account);
  const UsageStatusIcon = usageStatus.icon;

  return (
    <article
      className={`surface-panel relative p-5 transition-[transform,border-color,box-shadow] duration-200 ${
        account.is_active
          ? "border-[var(--accent-secondary)] shadow-[var(--shadow-raised)]"
          : "hover:-translate-y-[1px] hover:border-[var(--border-strong)]"
      } ${account.is_active ? "border-[var(--accent-primary)]" : ""}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-border)] to-transparent" />

      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            {account.is_active ? (
              <span className="chip chip-accent">
                <IconCheck className="h-3.5 w-3.5" />
                Active
              </span>
            ) : (
              <span className="chip">
                <IconActivity className="h-3.5 w-3.5" />
                Standby
              </span>
            )}
            <span className={usageStatus.className}>
              <UsageStatusIcon className="h-3.5 w-3.5" />
              {usageStatus.label}
            </span>
          </div>

          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              name="accountRename"
              aria-label="Account name"
              autoComplete="off"
              disabled={isRenaming}
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              onBlur={() => {
                void commitRename();
              }}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-base font-semibold text-[var(--text-primary)]"
            />
          ) : (
            <button
              type="button"
              aria-label="Rename Account"
              onClick={() => !masked && setIsEditing(true)}
              disabled={masked || isRenaming}
              className="w-full cursor-pointer truncate text-left text-lg font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)] disabled:cursor-default disabled:hover:text-[var(--text-primary)]"
            >
              <BlurredText blur={masked}>{account.name}</BlurredText>
            </button>
          )}

          <div className="mt-1 flex min-w-0 items-center gap-2 text-sm text-secondary">
            {account.auth_mode === "api_key" ? (
              <IconKey className="h-4 w-4" />
            ) : (
              <IconShieldCheck className="h-4 w-4" />
            )}
            {account.email ? <span className="truncate"><BlurredText blur={masked}>{account.email}</BlurredText></span> : <span className="text-muted">No email available</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onToggleMask && (
            <IconButton
              aria-label="Toggle Account Visibility"
              onClick={onToggleMask}
              title={masked ? "Show account details" : "Hide account details"}
            >
              {masked ? <IconEye className="h-4 w-4" /> : <IconEyeOff className="h-4 w-4" />}
            </IconButton>
          )}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2 border-y border-[var(--border-soft)] py-3">
        <span className="chip">
          <IconActivity className="h-3.5 w-3.5" />
          {planDisplay}
        </span>
        <span className="chip">
          <IconShieldCheck className="h-3.5 w-3.5" />
          {authModeDisplay}
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] p-3">
        <UsageBar usage={account.usage} loading={isRefreshing || account.usageLoading} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2"><IconClock className="h-3.5 w-3.5" />Last updated</span>
        <span className="mono-data">{formatLastRefresh(lastRefresh)}</span>
      </div>

      <footer className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          onClick={() => {
            void handleRefresh();
          }}
          disabled={isRefreshing}
        >
          <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing…" : "Refresh Usage"}
        </Button>

        <IconButton aria-label="Remove Account" onClick={onDelete} tone="danger">
          <IconTrash className="h-4 w-4" />
        </IconButton>
      </footer>
    </article>
  );
}
