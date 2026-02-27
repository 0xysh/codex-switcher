import type { AccountWithUsage, CodexProcessInfo } from "../../types";

export type AccountFilter = "all" | "oauth" | "imported" | "attention";
export type AccountSort = "recent" | "name" | "usage";

export interface ActivityEntry {
  id: number;
  kind: "success" | "warning" | "neutral";
  text: string;
  createdAt: number;
}

export interface ProcessSummary {
  title: string;
  text: string;
  tone: "chip" | "chip chip-warning" | "chip chip-success";
}

export interface FilterAndSortAccountsInput {
  accounts: AccountWithUsage[];
  query: string;
  filter: AccountFilter;
  sort: AccountSort;
}

export interface AccountSummary {
  total: number;
  attention: number;
  oauth: number;
  imported: number;
}

export type { CodexProcessInfo };
