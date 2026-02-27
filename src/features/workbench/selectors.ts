import type { AccountWithUsage } from "../../types";
import type { AccountSummary } from "./types";

export function getUsageRemaining(account: AccountWithUsage): number | null {
  if (typeof account.usage?.primary_used_percent !== "number") {
    return null;
  }

  return Math.max(0, 100 - account.usage.primary_used_percent);
}

export function needsAttention(account: AccountWithUsage): boolean {
  if (account.usage?.error) {
    return true;
  }

  const remaining = getUsageRemaining(account);
  return typeof remaining === "number" && remaining <= 15;
}

export function getRelativeTime(timestamp: number, nowMs = Date.now()): string {
  const diffSeconds = Math.floor((nowMs - timestamp) / 1000);

  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export function summarizeAccounts(accounts: AccountWithUsage[]): AccountSummary {
  const attention = accounts.filter((account) => needsAttention(account)).length;
  const oauth = accounts.filter((account) => account.auth_mode === "chat_gpt").length;
  const imported = accounts.filter((account) => account.auth_mode === "api_key").length;

  return {
    total: accounts.length,
    attention,
    oauth,
    imported,
  };
}
