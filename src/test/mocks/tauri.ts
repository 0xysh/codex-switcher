import { vi } from "vitest";

type CodexProcessInfo = {
  count: number;
  can_switch: boolean;
  pids: number[];
};

const defaultProcessInfo: CodexProcessInfo = {
  count: 0,
  can_switch: true,
  pids: [],
};

export const invokeMock = vi.fn(async (command: string) => {
  switch (command) {
    case "list_accounts":
    case "refresh_all_accounts_usage":
      return [];
    case "check_codex_processes":
      return defaultProcessInfo;
    default:
      return null;
  }
});

export const openDialogMock = vi.fn(async () => null);
export const openUrlMock = vi.fn(async () => undefined);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: openDialogMock,
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: openUrlMock,
}));
