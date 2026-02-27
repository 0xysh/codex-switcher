import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import type { CurrentAuthSummary } from "../../../../types";
import { CurrentCodexSessionCard } from "../CurrentCodexSessionCard";

const onRefresh = vi.fn(async () => undefined);
const onSaveSnapshot = vi.fn(async () => "/tmp/auth-snapshot.json");
const onImportSnapshot = vi.fn();

function createSummary(status: CurrentAuthSummary["status"]): CurrentAuthSummary {
  return {
    status,
    auth_mode: "chat_gpt",
    email: "session@example.com",
    plan_type: "plus",
    auth_file_path: "/Users/test/.codex/auth.json",
    snapshots_dir_path: "/Users/test/.codex-switcher/snapshots",
    last_modified_at: new Date("2026-02-27T00:00:00.000Z").toISOString(),
    message: status === "ready" ? null : "session unavailable",
  };
}

it("renders status variants for ready, missing, invalid, and error", () => {
  const { rerender } = render(
    <CurrentCodexSessionCard
      summary={createSummary("ready")}
      onRefresh={onRefresh}
      onSaveSnapshot={onSaveSnapshot}
      onImportSnapshot={onImportSnapshot}
    />,
  );

  expect(screen.getByText(/status: ready/i)).toBeInTheDocument();

  rerender(
    <CurrentCodexSessionCard
      summary={createSummary("missing")}
      onRefresh={onRefresh}
      onSaveSnapshot={onSaveSnapshot}
      onImportSnapshot={onImportSnapshot}
    />,
  );
  expect(screen.getByText(/status: missing/i)).toBeInTheDocument();

  rerender(
    <CurrentCodexSessionCard
      summary={createSummary("invalid")}
      onRefresh={onRefresh}
      onSaveSnapshot={onSaveSnapshot}
      onImportSnapshot={onImportSnapshot}
    />,
  );
  expect(screen.getByText(/status: invalid/i)).toBeInTheDocument();

  rerender(
    <CurrentCodexSessionCard
      summary={createSummary("error")}
      onRefresh={onRefresh}
      onSaveSnapshot={onSaveSnapshot}
      onImportSnapshot={onImportSnapshot}
    />,
  );
  expect(screen.getByText(/status: error/i)).toBeInTheDocument();
});

it("wires refresh, save snapshot, and import snapshot actions", async () => {
  const user = userEvent.setup();
  render(
    <CurrentCodexSessionCard
      summary={createSummary("ready")}
      onRefresh={onRefresh}
      onSaveSnapshot={onSaveSnapshot}
      onImportSnapshot={onImportSnapshot}
    />,
  );

  await user.click(screen.getByRole("button", { name: /refresh session/i }));
  await user.click(screen.getByRole("button", { name: /save snapshot/i }));
  await user.click(screen.getByRole("button", { name: /import snapshot/i }));

  expect(onRefresh).toHaveBeenCalledTimes(1);
  expect(onSaveSnapshot).toHaveBeenCalledTimes(1);
  expect(onImportSnapshot).toHaveBeenCalledTimes(1);
});
