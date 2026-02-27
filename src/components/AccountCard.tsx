import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import type { AccountWithUsage } from "../types";
import { UsageBar } from "./UsageBar";
import {
  Button,
  IconActivity,
  IconAlertTriangle,
  IconArrowRightLeft,
  IconCheck,
  IconClock,
  IconEye,
  IconEyeOff,
  IconButton,
  IconKey,
  IconPanelRight,
  IconRefresh,
  IconShieldCheck,
  IconTrash,
} from "./ui";

interface AccountCardProps {
  account: AccountWithUsage;
  onSwitch: () => void;
  onDelete: () => void;
  onRefresh: () => Promise<void>;
  onRename: (newName: string) => Promise<void>;
  switching?: boolean;
  switchDisabled?: boolean;
  masked?: boolean;
  selected?: boolean;
  onToggleMask?: () => void;
  onViewDetails?: () => void;
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

  if (
    typeof account.usage?.primary_used_percent === "number" &&
    account.usage.primary_used_percent >= 80
  ) {
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
  onSwitch,
  onDelete,
  onRefresh,
  onRename,
  switching,
  switchDisabled,
  masked = false,
  selected = false,
  onToggleMask,
  onViewDetails,
}: AccountCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(
    account.usage && !account.usage.error ? new Date() : null
  );
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

    if (!trimmed || trimmed === account.name) {
      setEditName(account.name);
      setIsEditing(false);
      return;
    }

    try {
      await onRename(trimmed);
    } catch {
      setEditName(account.name);
    } finally {
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
    : account.auth_mode === "api_key"
      ? "API Key"
      : "Unknown";

  const authModeDisplay = account.auth_mode === "api_key" ? "Imported" : "OAuth";
  const usageStatus = getUsageStatus(account);
  const UsageStatusIcon = usageStatus.icon;

  return (
    <article
      className={`surface-panel relative p-5 transition-[transform,border-color,box-shadow] duration-200 ${
        selected
          ? "border-[var(--accent-secondary)] shadow-[var(--shadow-raised)]"
          : "hover:-translate-y-[1px] hover:border-[var(--border-strong)]"
      } ${account.is_active ? "border-[var(--accent-primary)]" : ""}`}
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            {account.is_active ? (
              <span className="chip chip-accent">
                <IconCheck className="h-3.5 w-3.5" />
                Active
              </span>
            ) : (
              <span className="chip">
                <IconArrowRightLeft className="h-3.5 w-3.5" />
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
              disabled={masked}
              className="w-full cursor-pointer truncate text-left text-lg font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)] disabled:cursor-default disabled:hover:text-[var(--text-primary)]"
            >
              <BlurredText blur={masked}>{account.name}</BlurredText>
            </button>
          )}

          <div className="mt-1 flex items-center gap-2 text-sm text-secondary">
            {account.auth_mode === "api_key" ? (
              <IconKey className="h-4 w-4" />
            ) : (
              <IconShieldCheck className="h-4 w-4" />
            )}
            {account.email ? <BlurredText blur={masked}>{account.email}</BlurredText> : "No email available"}
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
          {onViewDetails && (
            <IconButton aria-label="View Account Details" onClick={onViewDetails}>
              <IconPanelRight className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
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

      <div className="mb-4 flex items-center gap-2 text-xs text-muted">
        <IconClock className="h-3.5 w-3.5" />
        Last updated {formatLastRefresh(lastRefresh)}
      </div>

      {switchDisabled && !account.is_active && (
        <div className="mb-4 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-soft)] px-3 py-2 text-xs text-[var(--warning)]">
          Close all running Codex processes before switching accounts.
        </div>
      )}

      <footer className="flex items-center gap-2">
        {account.is_active ? (
          <Button
            variant="secondary"
            size="md"
            className="flex-1 border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-primary)]"
            disabled
          >
            <IconCheck className="h-4 w-4" />
            Active Now
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={onSwitch}
            disabled={switching || switchDisabled}
          >
            <IconArrowRightLeft className="h-4 w-4" />
            {switching ? "Switching…" : "Switch Now"}
          </Button>
        )}

        <IconButton
          aria-label="Refresh Usage"
          onClick={() => {
            void handleRefresh();
          }}
          disabled={isRefreshing}
          tone="accent"
        >
          <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </IconButton>

        <IconButton aria-label="Remove Account" onClick={onDelete} tone="danger">
          <IconTrash className="h-4 w-4" />
        </IconButton>
      </footer>
    </article>
  );
}
