import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, KeyboardEvent } from "react";

import type { AccountWithUsage } from "../types";
import { AccountCardHeader } from "./AccountCardHeader";
import { UsageBar } from "./UsageBar";
import {
  Button,
  IconAlertTriangle,
  IconButton,
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 z-0 h-[3px] rounded-b-full bg-gradient-to-r from-[var(--accent-border)] via-[var(--accent-soft)] to-[var(--usage-7d-soft)] opacity-80"
      />

      <AccountCardHeader
        account={account}
        isCompact={isCompact}
        isEditing={isEditing}
        isRenaming={isRenaming}
        editName={editName}
        inputRef={inputRef}
        onEditNameChange={setEditName}
        onStartEditing={() => setIsEditing(true)}
        onCommitRename={() => {
          void commitRename();
        }}
        onKeyDown={handleKeyDown}
        creditsBalance={creditsBalance}
        dragHandleProps={dragHandleProps}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          void handleRefresh();
        }}
        usageStatus={usageStatus}
        UsageStatusIcon={UsageStatusIcon}
        planDisplay={planDisplay}
        authModeDisplay={authModeDisplay}
        lastRefresh={lastRefresh}
        formatLastRefresh={formatLastRefresh}
      />
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
