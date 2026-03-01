import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import type { CodexProcessInfo } from "../../../../types";
import type { AccountSummary } from "../../types";
import { WorkbenchHeader } from "../WorkbenchHeader";

const summary: AccountSummary = {
  total: 3,
  attention: 1,
  oauth: 2,
  imported: 1,
};

const processInfo: CodexProcessInfo = {
  count: 2,
  can_switch: false,
  pids: [1234, 5678],
};

function createProps(overrides?: Partial<Parameters<typeof WorkbenchHeader>[0]>) {
  return {
    isRefreshing: false,
    summary,
    processInfo,
    cardDensityMode: "full" as const,
    themePreference: "light" as const,
    isCollapsed: false,
    onRefreshUsage: vi.fn(),
    onOpenAddAccount: vi.fn(),
    onOpenThemePalette: vi.fn(),
    onToggleCardDensityMode: vi.fn(),
    onThemeChange: vi.fn(),
    onToggleCollapsed: vi.fn(),
    ...overrides,
  };
}

it("shows control rail actions while expanded", () => {
  render(<WorkbenchHeader {...createProps()} />);

  expect(screen.getByText(/control rail/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /refresh usage/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /collapse header panel/i })).toBeInTheDocument();
});

it("hides control rail content while collapsed and toggles expansion", async () => {
  const user = userEvent.setup();
  const onToggleCollapsed = vi.fn();

  render(
    <WorkbenchHeader
      {...createProps({
        isCollapsed: true,
        onToggleCollapsed,
      })}
    />,
  );

  expect(screen.queryByText(/control rail/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /refresh usage/i })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /expand header panel/i }));
  expect(onToggleCollapsed).toHaveBeenCalledTimes(1);
});
