import type { CurrentAuthSummary } from "../index";

const status: CurrentAuthSummary["status"] = "ready";

export const currentAuthSummaryTypecheck: CurrentAuthSummary = {
  status,
  auth_mode: "chat_gpt",
  email: null,
  plan_type: null,
  auth_file_path: "~/.codex/auth.json",
  snapshots_dir_path: "~/.codex-switcher/snapshots",
  last_modified_at: null,
  message: null,
};
