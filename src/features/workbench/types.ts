import type { CodexProcessInfo } from "../../types";

export interface ActivityEntry {
  id: number;
  kind: "success" | "warning" | "neutral";
  text: string;
  createdAt: number;
}

export interface AccountSummary {
  total: number;
  attention: number;
  oauth: number;
  imported: number;
}

export type { CodexProcessInfo };
