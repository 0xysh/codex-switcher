import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";

import type { CurrentAuthSummary } from "../../types";
import { invokeMock } from "../../test/mocks/tauri";
import { useAccounts } from "../useAccounts";

const READY_SUMMARY: CurrentAuthSummary = {
  status: "ready",
  auth_mode: "chat_gpt",
  email: "session@example.com",
  plan_type: "plus",
  auth_file_path: "/Users/test/.codex/auth.json",
  snapshots_dir_path: "/Users/test/.codex-switcher/snapshots",
  last_modified_at: new Date().toISOString(),
  message: null,
};

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockImplementation(
    (async (command: string) => {
      switch (command) {
        case "list_accounts":
        case "refresh_all_accounts_usage":
          return [];
        case "get_current_auth_summary":
          return READY_SUMMARY;
        case "create_auth_snapshot":
          return "/Users/test/.codex-switcher/snapshots/auth-snapshot-1.json";
        default:
          return null;
      }
    }) as unknown as Parameters<typeof invokeMock.mockImplementation>[0],
  );
});

it("refreshCurrentSession loads current auth summary", async () => {
  const { result } = renderHook(() => useAccounts());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  await act(async () => {
    await result.current.refreshCurrentSession();
  });

  expect(invokeMock).toHaveBeenCalledWith("get_current_auth_summary");
  expect(result.current.currentSession?.status).toBe("ready");
});

it("saveCurrentSessionSnapshot creates snapshot and refreshes session metadata", async () => {
  const { result } = renderHook(() => useAccounts());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  let snapshotPath: string | null = null;
  await act(async () => {
    snapshotPath = await result.current.saveCurrentSessionSnapshot();
  });

  expect(snapshotPath).toContain("auth-snapshot");
  expect(invokeMock).toHaveBeenCalledWith("create_auth_snapshot");
  expect(invokeMock).toHaveBeenCalledWith("get_current_auth_summary");
  expect(result.current.snapshotsDirPath).toBe(READY_SUMMARY.snapshots_dir_path);
});

it("returns snapshot path even when summary refresh fails afterward", async () => {
  let summaryCalls = 0;
  invokeMock.mockImplementation(
    (async (command: string) => {
      switch (command) {
        case "list_accounts":
        case "refresh_all_accounts_usage":
          return [];
        case "get_current_auth_summary":
          summaryCalls += 1;
          if (summaryCalls > 1) {
            throw new Error("summary unavailable");
          }
          return READY_SUMMARY;
        case "create_auth_snapshot":
          return "/Users/test/.codex-switcher/snapshots/auth-snapshot-2.json";
        default:
          return null;
      }
    }) as unknown as Parameters<typeof invokeMock.mockImplementation>[0],
  );

  const { result } = renderHook(() => useAccounts());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  let snapshotPath: string | null = null;
  await act(async () => {
    snapshotPath = await result.current.saveCurrentSessionSnapshot();
  });

  expect(snapshotPath).toContain("auth-snapshot-2.json");
});
