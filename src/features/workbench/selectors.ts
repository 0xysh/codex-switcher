import type { AccountWithUsage } from "../../types";
import type {
  AccountSummary,
  FilterAndSortAccountsInput,
  ProcessSummary,
} from "./types";
import type { CodexProcessInfo } from "./types";

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

export function summarizeSafety(processInfo: CodexProcessInfo | null): ProcessSummary {
  if (!processInfo) {
    return {
      title: "Checking process safety",
      text: "Validating if Codex processes allow account switching.",
      tone: "chip",
    };
  }

  if (processInfo.count > 0) {
    return {
      title: "Switching locked",
      text: `${processInfo.count} Codex process${processInfo.count === 1 ? " is" : "es are"} still running.`,
      tone: "chip chip-warning",
    };
  }

  return {
    title: "Safe to switch",
    text: "No running Codex processes detected.",
    tone: "chip chip-success",
  };
}

function matchesQuery(account: AccountWithUsage, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true;
  }

  return (
    account.name.toLowerCase().includes(normalizedQuery) ||
    (account.email ?? "").toLowerCase().includes(normalizedQuery)
  );
}

export function filterAndSortAccounts({
  accounts,
  query,
  filter,
  sort,
}: FilterAndSortAccountsInput): AccountWithUsage[] {
  const normalizedQuery = query.trim().toLowerCase();

  const queryFiltered = accounts.filter((account) => matchesQuery(account, normalizedQuery));

  const statusFiltered = queryFiltered.filter((account) => {
    if (filter === "all") return true;
    if (filter === "oauth") return account.auth_mode === "chat_gpt";
    if (filter === "imported") return account.auth_mode === "api_key";
    return needsAttention(account);
  });

  return [...statusFiltered].sort((left, right) => {
    if (left.is_active && !right.is_active) return -1;
    if (!left.is_active && right.is_active) return 1;

    if (sort === "name") {
      return left.name.localeCompare(right.name);
    }

    if (sort === "usage") {
      const leftRemaining = getUsageRemaining(left);
      const rightRemaining = getUsageRemaining(right);

      if (leftRemaining === null && rightRemaining === null) return 0;
      if (leftRemaining === null) return 1;
      if (rightRemaining === null) return -1;

      return leftRemaining - rightRemaining;
    }

    const leftLastUsed = left.last_used_at ? new Date(left.last_used_at).getTime() : 0;
    const rightLastUsed = right.last_used_at ? new Date(right.last_used_at).getTime() : 0;
    return rightLastUsed - leftLastUsed;
  });
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
