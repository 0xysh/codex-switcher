import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, KeyboardEvent } from "react";
import type { AccountWithUsage } from "../types";
import { UsageBar } from "./UsageBar";
import {
  Button,
  IconActivity,
  IconAlertTriangle,
  IconClock,
  IconGripVertical,
  IconButton,
  IconKey,
  IconRefresh,
  IconShieldCheck,
  IconTrash,
  IconArrowRightLeft,
} from "./ui";
interface AccountCardProps {
  account: AccountWithUsage;
  onDelete: () => void;
  onRefresh: () => Promise<void>;
  onReconnect?: () => Promise<void>;
  onRename: (newName: string) => Promise<void>;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  displayMode?: "full" | "compact";
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
  onReconnect,
  onRename,
  dragHandleProps,
  isDragging = false,
  displayMode = "full",
}: AccountCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
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

  const handleReconnect = async () => {
    if (!onReconnect) {
      return;
    }
    setIsReconnecting(true);
    try {
      await onReconnect();
      setLastRefresh(new Date());
    } catch {
      return;
    } finally {
      setIsReconnecting(false);
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
  const usageStatus = displayMode === "full" ? getUsageStatus(account) : null;
  const UsageStatusIcon = usageStatus?.icon;
  const creditsBalance = account.usage?.credits_balance;
  const canReconnect = account.auth_mode === "chat_gpt" && !!onReconnect;
  const isCompact = displayMode === "compact";

  return (
    <article
      className={`surface-panel reveal-rise relative overflow-hidden p-5 transition-[border-color,box-shadow] duration-200 ${
        account.is_active
          ? "border-[var(--accent-border)] shadow-[var(--shadow-raised)]"
          : "hover:border-[var(--border-strong)]"
      } ${isDragging ? "ring-2 ring-[var(--accent-border)]" : ""} ${isCompact ? "grid h-full min-h-[15.5rem] grid-rows-[auto_1fr]" : ""}`}
    >
      <header
        className={`relative overflow-hidden ${
          isCompact
            ? "mb-5 min-h-[4.5rem] rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-4 py-3.5 shadow-[var(--shadow-soft)]"
            : "mb-4 space-y-3"
        }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[var(--accent-soft)] via-transparent to-[var(--usage-7d-soft)] opacity-55"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-border)] to-transparent"
        />

        <div className={isCompact ? "relative z-10 flex h-full items-center gap-3" : "relative z-10 flex items-start gap-2"}>
          <div className="min-w-0 flex-1">
            {isCompact ? (
              <p className="truncate text-[1.08rem] font-semibold leading-6 text-[var(--text-primary)]">
                {account.name}
              </p>
            ) : (
              <>
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
                    className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-[1.02rem] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
                  />
                ) : (
                  <button
                    type="button"
                    aria-label="Rename Account"
                    onClick={() => setIsEditing(true)}
                    disabled={isRenaming}
                    className="w-full cursor-pointer truncate text-left text-[1.12rem] font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-primary)] disabled:cursor-default disabled:hover:text-[var(--text-primary)]"
                  >
                    {account.name}
                  </button>
                )}
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2 text-sm text-secondary shadow-[var(--shadow-soft)]">
                  <div className="flex min-w-0 items-center gap-2">
                    {account.auth_mode === "api_key" ? (
                      <IconKey className="h-4 w-4" />
                    ) : (
                      <IconShieldCheck className="h-4 w-4" />
                    )}
                    {account.email ? (
                      <span className="truncate">{account.email}</span>
                    ) : (
                      <span className="text-muted">No email available</span>
                    )}
                  </div>
                  {creditsBalance ? (
                    <p className="mono-data shrink-0 rounded-full border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[11px] text-secondary">
                      Credits: {creditsBalance}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          <div className={isCompact ? "flex shrink-0 items-center gap-2.5" : "mt-0.5 flex shrink-0 items-center gap-2"}>
            {isCompact ? (
              <IconButton
                aria-label={`Refresh ${account.name} usage`}
                tone="accent"
                size="sm"
                onClick={() => {
                  void handleRefresh();
                }}
                disabled={isRefreshing}
              >
                <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </IconButton>
            ) : null}
            {dragHandleProps ? (
              <IconButton
                aria-label={dragHandleProps["aria-label"] ?? `Reorder ${account.name}`}
                tone="accent"
                size="sm"
                className="touch-none cursor-grab active:cursor-grabbing"
                {...dragHandleProps}
              >
                <IconGripVertical className="h-4 w-4" />
              </IconButton>
            ) : null}
          </div>
        </div>

        {!isCompact ? (
          <div className="relative z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2.5 shadow-[var(--shadow-soft)]">
            {usageStatus && UsageStatusIcon ? (
              <span className={usageStatus.className}>
                <UsageStatusIcon className="h-3.5 w-3.5" />
                {usageStatus.label}
              </span>
            ) : null}
            <span className="chip">
              <IconActivity className="h-3.5 w-3.5" />
              {planDisplay}
            </span>
            <span className="chip">
              <IconShieldCheck className="h-3.5 w-3.5" />
              {authModeDisplay}
            </span>
            <span className="chip ml-auto min-w-max" title={lastRefresh ? lastRefresh.toLocaleString() : "No usage refresh yet"}>
              <IconClock className="h-3.5 w-3.5" />
              Updated {formatLastRefresh(lastRefresh)}
            </span>
          </div>
        ) : null}
      </header>
      <div className={isCompact ? "grid min-h-0 place-items-center" : undefined}>
        <div
          className={`rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] p-3.5 shadow-[var(--shadow-soft)] ${
            isCompact ? "w-full" : "mb-4"
          }`}
        >
          <UsageBar usage={account.usage} loading={isRefreshing || account.usageLoading} />
        </div>
      </div>

      {!isCompact ? (
        <footer className="flex items-center gap-2 border-t border-[var(--border-soft)] pt-3">
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
          {canReconnect ? (
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => {
                void handleReconnect();
              }}
              disabled={isReconnecting}
            >
              <IconArrowRightLeft className={`h-4 w-4 ${isReconnecting ? "animate-pulse" : ""}`} />
              {isReconnecting ? "Reconnecting…" : "Reconnect"}
            </Button>
          ) : null}

          <IconButton aria-label="Remove Account" onClick={onDelete} tone="danger">
            <IconTrash className="h-4 w-4" />
          </IconButton>
        </footer>
      ) : null}
    </article>
  );
}
